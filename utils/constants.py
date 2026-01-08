COUNTRIES = [
    "Afrique du Sud",
    "Algérie",
    "Angola",
    "Bénin",
    "Botswana",
    "Burkina Faso",
    "Burundi",
    "Cameroun",
    "Cap-Vert",
    "Comores",
    "Congo-Brazzaville",
    "Congo-Kinshasa",
    "Côte d'Ivoire",
    "Djibouti",
    "Égypte",
    "Gabon",
    "Gambie",
    "Ghana",
    "Guinée",
    "Kenya",
    "Madagascar",
    "Mali",
    "Maroc",
    "Maurice",
    "Mauritanie",
    "Niger",
    "Nigeria",
    "Ouganda",
    "Rwanda",
    "Sénégal",
    "Tchad",
    "Togo",
    "Tunisie",
]

MODE_VIDEO = "video"
MODE_TEXT = "text"

SESSION_ID_PREFIX = "sess_"

MAX_MESSAGE_LENGTH = 1000
MIN_PASSWORD_LENGTH = 6
MAX_NAME_LENGTH = 30

ICE_SERVERS = [
    {"urls": "stun:stun.l.google.com:19302"},
    {"urls": "stun:stun1.l.google.com:19302"},
    {"urls": "stun:stun2.l.google.com:19302"},
    {
        "urls": "turn:openrelay.metered.ca:443",
        "username": "openrelayproject",
        "credential": "openrelayproject",
    },
]

RATE_LIMIT_DEFAULT = 60
RATE_LIMIT_WINDOW = 60
