package ph.gov.santarosa.petcare.web;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ph.gov.santarosa.petcare.repository.ShelterPetRepository;
import ph.gov.santarosa.petcare.service.StateAssembler;

/** Public, read-only information used by the mobile guest experience. */
@RestController
@RequestMapping("/api/public")
public class PublicController {
    private final ShelterPetRepository shelterPets;

    public PublicController(ShelterPetRepository shelterPets) {
        this.shelterPets = shelterPets;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "service", "PetCARE");
    }

    @GetMapping("/bootstrap")
    public Map<String, Object> bootstrap() {
        List<Map<String, Object>> dogs = shelterPets.findAll().stream()
                .filter(pet -> !"Adopted".equalsIgnoreCase(pet.getStatus()))
                .sorted(Comparator.comparing(pet -> pet.getName() == null ? "" : pet.getName()))
                .map(StateAssembler::shelterPet)
                .toList();
        return Map.of("shelterPets", dogs);
    }
}
