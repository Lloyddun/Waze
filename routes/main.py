from flask import Blueprint, render_template

main_bp = Blueprint("main", __name__)


@main_bp.route("/selection")
def selection():
    return render_template("selection.html")


@main_bp.route("/video")
def video():
    return render_template("main/main.html", mode="video")


@main_bp.route("/chat")
def chat():
    return render_template("main/main.html", mode="chat")
