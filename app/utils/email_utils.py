# app/utils/email_utils.py
from flask_mail import Message
from app.extensions import mail
from flask import render_template

def send_email(subject, recipients, text_body, html_body=None):
    msg = Message(subject, recipients=recipients)
    msg.body = text_body
    if html_body:
        msg.html = html_body
    mail.send(msg)