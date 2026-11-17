package ph.gov.santarosa.petcare.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ph.gov.santarosa.petcare.domain.AppUser;
import ph.gov.santarosa.petcare.domain.Pet;
import ph.gov.santarosa.petcare.domain.PetRegistration;
import ph.gov.santarosa.petcare.repository.AppUserRepository;
import ph.gov.santarosa.petcare.repository.PetRegistrationRepository;
import ph.gov.santarosa.petcare.repository.PetRepository;

/** Pet registration (resident or walk-in) and the CVO staff's verify / reject decision. */
@Service
public class PetWorkflowService {

    public record RegisterPet(String ownerId, String name, String species, String breed, String sex, String dob,
                              String color, String barangay, BigDecimal weight, String healthStatus, String healthNotes,
                              String rabiesStatus, String lastRabies, String dewormingStatus, String lastDeworming,
                              String microchipStatus, String microchipNumber, String proofOfResidency) { }

    public record Registered(String petId, String registrationId) { }

    private final PetRepository pets;
    private final PetRegistrationRepository registrations;
    private final AppUserRepository users;
    private final IdGenerator ids;
    private final Notifier notifier;
    private final Clock clock;

    public PetWorkflowService(PetRepository pets, PetRegistrationRepository registrations, AppUserRepository users,
                              IdGenerator ids, Notifier notifier, @Qualifier("clock") Clock clock) {
        this.pets = pets; this.registrations = registrations; this.users = users;
        this.ids = ids; this.notifier = notifier; this.clock = clock;
    }

    @Transactional
    public Registered registerPet(AppUser actor, RegisterPet r) {
        Access.require(actor, Values.OWNER, Values.STAFF);
        boolean walkIn = Values.STAFF.equals(actor.getRole());
        LocalDate today = LocalDate.now(clock);

        // Who owns the pet: a resident registers for themself; staff register for a resident standing at the counter.
        AppUser owner;
        if (walkIn) {
            owner = users.findById(Validation.text(r.ownerId(), "Resident", 20, true))
                    .filter(u -> Values.OWNER.equals(u.getRole()) && "Active".equals(u.getStatus()))
                    .orElseThrow(() -> ApiException.badRequest("Resident account not found or not active."));
        } else {
            owner = actor;
        }

        String name = Validation.text(r.name(), "Pet name", 80, true);
        String species = Validation.text(r.species(), "Species", 20, false);
        if (species != null && !"Dog".equals(species)) throw ApiException.badRequest("Only dogs can be registered.");
        String breed = Validation.text(r.breed(), "Breed", 80, true);
        String sex = Validation.oneOf(r.sex(), "Sex", Values.SEX, true);
        LocalDate dob = Validation.pastOrToday(r.dob(), "Date of birth", true, today);
        if (dob.isBefore(today.minusYears(30))) throw ApiException.badRequest("Date of birth is not realistic.");
        String color = Validation.text(r.color(), "Color / description", 120, false);
        String barangay = Validation.text(r.barangay(), "Barangay", 80, true);
        if (r.weight() == null) throw ApiException.badRequest("Weight is required.");
        BigDecimal weight = r.weight().setScale(2, RoundingMode.HALF_UP);
        if (weight.signum() <= 0 || weight.compareTo(new BigDecimal("120")) > 0)
            throw ApiException.badRequest("Weight must be between 0 and 120 kg.");
        String health = Validation.oneOf(r.healthStatus(), "Health status", Values.HEALTH, true);
        String notes = Validation.text(r.healthNotes(), "Health notes", 1000, false);
        String rabies = Validation.oneOf(r.rabiesStatus(), "Anti-rabies status", Values.UPDATE_STATUS, true);
        LocalDate lastRabies = "Updated".equals(rabies) ? Validation.pastOrToday(r.lastRabies(), "Last anti-rabies date", false, today) : null;
        String deworm = Validation.oneOf(r.dewormingStatus(), "Deworming status", Values.UPDATE_STATUS, true);
        LocalDate lastDeworm = "Updated".equals(deworm) ? Validation.pastOrToday(r.lastDeworming(), "Last deworming date", false, today) : null;
        String chipStatus = Validation.oneOf(r.microchipStatus(), "Microchip status", Values.MICROCHIP_STATUS, true);
        String chip = "Microchipped".equals(chipStatus) ? Validation.microchip(r.microchipNumber()) : null;
        String residency = Validation.oneOf(r.proofOfResidency(), "Proof of residency", Values.RESIDENCY, true);
        // "Verified at Barangay" is a verification, not a claim: only staff may record it.
        if (!walkIn && "Verified at Barangay".equals(residency)) residency = "Submitted, Pending Verification";

        if (pets.existsByOwnerIdAndNameIgnoreCaseAndDob(owner.getId(), name, dob))
            throw ApiException.conflict(walkIn ? "This resident already has a pet with the same name and birth date."
                                               : "You already registered a pet with the same name and birth date.");
        if (chip != null && pets.findByMicrochip(chip).isPresent())
            throw ApiException.conflict("That microchip number is already registered to another pet.");

        Pet p = new Pet();
        p.setId(ids.next("pet"));
        p.setOwnerId(owner.getId());
        p.setName(name); p.setSpecies("Dog"); p.setBreed(breed); p.setSex(sex); p.setDob(dob);
        p.setColor(color); p.setBarangay(barangay);
        p.setRegistrationStatus("Pending"); p.setRegisteredDate(null);
        p.setRegistrationSource(walkIn ? "Walk-in" : "Owner");
        p.setWeightKg(weight); p.setHealthStatus(health); p.setHealthNotes(notes);
        p.setRabiesStatus(rabies); p.setLastRabies(lastRabies);
        p.setDewormingStatus(deworm); p.setLastDeworming(lastDeworm);
        p.setProofOfResidency(residency);
        p.setMicrochip(chip); p.setMicrochipStatus(chipStatus);
        pets.save(p);

        PetRegistration reg = new PetRegistration();
        reg.setId(ids.next("reg"));
        reg.setPetId(p.getId());
        reg.setOwnerId(owner.getId());
        reg.setStatus("Pending");
        reg.setSubmittedDate(today);
        reg.setSource(p.getRegistrationSource());
        registrations.save(reg);

        notifier.notify(owner.getId(), "Pet registration submitted.",
                "Your registration for " + name + " has been submitted and is pending CVO verification.");
        notifier.audit(actor, "Create", "Pet Registration", reg.getId(), "Pet registration submitted for " + name + ".");
        return new Registered(p.getId(), reg.getId());
    }

    /** @param onSite true for the walk-in counter ("verify now"), which uses the on-site wording. */
    @Transactional
    public void verifyRegistration(AppUser actor, String registrationId, boolean onSite) {
        Access.require(actor, Values.STAFF);
        PetRegistration reg = pending(registrationId);
        Pet pet = pets.findById(reg.getPetId()).orElseThrow(() -> ApiException.notFound("Pet not found."));
        reg.setStatus("Verified");
        reg.setReviewedBy(actor.getId());
        reg.setReviewedAt(notifier.now());
        pet.setRegistrationStatus("Verified");
        pet.setRegisteredDate(LocalDate.now(clock));
        registrations.save(reg);
        pets.save(pet);
        if (onSite) {
            notifier.notify(reg.getOwnerId(), "Pet registration approved.", pet.getName() + "'s registration has been verified by CVO staff on-site.");
            notifier.audit(actor, "Approve", "Pet Registration", reg.getId(), "Walk-in registration for " + pet.getName() + " verified on-site.");
        } else {
            notifier.notify(reg.getOwnerId(), "Pet registration approved.",
                    pet.getName() + "'s registration has been approved. " + pet.getName() + " is now a verified pet and eligible for veterinary services.");
            notifier.audit(actor, "Approve", "Pet Registration", reg.getId(), "Registration for " + pet.getName() + " approved.");
        }
    }

    @Transactional
    public void rejectRegistration(AppUser actor, String registrationId, String reason) {
        Access.require(actor, Values.STAFF);
        String why = Validation.text(reason, "Reason for rejection", 1000, true);
        PetRegistration reg = pending(registrationId);
        Pet pet = pets.findById(reg.getPetId()).orElseThrow(() -> ApiException.notFound("Pet not found."));
        reg.setStatus("Rejected");
        reg.setRejectionReason(why);
        reg.setReviewedBy(actor.getId());
        reg.setReviewedAt(notifier.now());
        pet.setRegistrationStatus("Rejected");
        registrations.save(reg);
        pets.save(pet);
        notifier.notify(reg.getOwnerId(), "Pet registration rejected.", pet.getName() + "'s registration was rejected. Reason: " + why);
        notifier.audit(actor, "Reject", "Pet Registration", reg.getId(), "Registration for " + pet.getName() + " rejected \u2014 " + why);
    }

    private PetRegistration pending(String id) {
        PetRegistration reg = registrations.findById(id == null ? "" : id).orElseThrow(() -> ApiException.notFound("Registration not found."));
        if (!"Pending".equals(reg.getStatus())) throw ApiException.conflict("This registration has already been reviewed.");
        return reg;
    }
}
