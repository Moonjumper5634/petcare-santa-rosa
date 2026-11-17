package ph.gov.santarosa.petcare.service;

import java.util.logging.Logger;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import ph.gov.santarosa.petcare.domain.AppUser;

/** Dev only: there is no email/SMS service, so the code is written to the console (and shown by the UI). */
@Profile("dev")
@Service
public class DevCodeSender implements CodeSender {
    private static final Logger LOG = Logger.getLogger(DevCodeSender.class.getName());

    @Override
    public void send(AppUser user, String purpose, String code) {
        LOG.info("[DEV] " + purpose + " code for " + user.getEmail() + ": " + code);
    }
}
