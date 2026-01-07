from flask import (
    Blueprint,
    render_template,
    redirect,
    url_for,
    request,
    jsonify,
    session,
)

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/")
def index():
    return render_template("auth/login.html")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("auth/login.html")

    data = request.get_json()

    return jsonify(
        {"status": "success", "message": "Login handled by Firebase on frontend"}
    )


@auth_bp.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "GET":
        return render_template("auth/signup.html")

    data = request.get_json()

    return jsonify(
        {"status": "success", "message": "Signup handled by Firebase on frontend"}
    )


@auth_bp.route("/logout")
def logout():
    return redirect(url_for("auth.index"))
