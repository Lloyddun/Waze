import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from dotenv import load_dotenv

load_dotenv()


class FirebaseService:
    _instance = None
    _initialized = False

    def __init__(self):
        if FirebaseService._instance is not None:
            return FirebaseService._instance

        FirebaseService._instance = self
        self._db = None

    def _initialize(self):
        if FirebaseService._initialized:
            return

        try:
            cred = self._get_credentials()
            if firebase_admin._apps:
                firebase_admin.delete_app(firebase_admin.get_app())
            firebase_admin.initialize_app(cred)
            self._db = firestore.client()
            FirebaseService._initialized = True
        except Exception as e:
            print(f"Firebase initialization warning: {e}")

    def _get_credentials(self):
        cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")
        if os.path.exists(cred_path):
            return cred_path
        return self._create_credentials_from_env()

    def _create_credentials_from_env(self):
        project_id = os.getenv("FIREBASE_PROJECT_ID")
        return credentials.ApplicationDefault()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_db(self):
        self._initialize()
        return self._db

    def get_user(self, uid):
        return self.get_db().collection("users").document(uid)

    def get_users_collection(self):
        return self.get_db().collection("users")

    def get_calls_collection(self):
        return self.get_db().collection("calls")


firebase_service = FirebaseService.get_instance()
