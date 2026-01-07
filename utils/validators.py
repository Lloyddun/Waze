import re
from email_validator import validate_email, EmailNotValidError


class Validators:
    @staticmethod
    def validate_email(email):
        try:
            validate_email(email)
            return True, "Email valide"
        except EmailNotValidError:
            return False, "Email invalide"

    @staticmethod
    def validate_password(password):
        if len(password) < 6:
            return False, "Le mot de passe doit contenir au moins 6 caractères"
        return True, "Mot de passe valide"

    @staticmethod
    def validate_name(name):
        if not name or len(name) < 2:
            return False, "Le nom doit contenir au moins 2 caractères"
        if len(name) > 30:
            return False, "Le nom ne peut pas dépasser 30 caractères"
        return True, "Nom valide"

    @staticmethod
    def validate_country(country):
        if not country or len(country) < 2:
            return False, "Pays invalide"
        return True, "Pays valide"

    @staticmethod
    def validate_message(text):
        if not text or len(text) == 0:
            return False, "Message vide"
        if len(text) > 1000:
            return False, "Le message ne peut pas dépasser 1000 caractères"
        return True, "Message valide"

    @staticmethod
    def validate_session_id(session_id):
        if not session_id or not isinstance(session_id, str):
            return False, "Session ID invalide"
        if not session_id.startswith("sess_"):
            return False, "Session ID format invalide"
        return True, "Session ID valide"

    @staticmethod
    def validate_webrtc_data(data):
        required_fields = ["type", "sdp"]
        for field in required_fields:
            if field not in data:
                return False, f"Champ manquant: {field}"
        return True, "Données WebRTC valides"
