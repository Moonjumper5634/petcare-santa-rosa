package ph.gov.santarosa.petcare.service;

import java.util.logging.Logger;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import ph.gov.santarosa.petcare.domain.AppUser;

/** Non-dev profiles: refuses to pretend a code was delivered. Replace with a real email/SMS CodeSender. */
@Profile("!dev")
@Service
public class UnconfiguredCodeSender implements CodeSender {
    private static final Logger LOG = Logger.getLogger(UnconfiguredCodeSender.class.getName());

    @Override
    public void send(AppUser user, String purpose, String code) {
        LOG.severe("No CodeSender is configured: the " + purpose + " code for user " + user.getId()
                + " was NOT delivered. Implement CodeSender (email/SMS) before going live.");
    }
}
