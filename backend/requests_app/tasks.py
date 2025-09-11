import os
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User

@shared_task(name="send_2fa_email_task")
def send_2fa_email_task(user_id, code):
    """
    Sends the 2FA code to the user's email in the background.
    """
    try:
        user = User.objects.get(id=user_id)
        subject = 'Código 2FA Clientes'
        message = f'Su código 2FA es: {code}'
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]
        
        send_mail(subject, message, from_email, recipient_list, fail_silently=False)
        
        return f"2FA email sent to {user.email}"
    except User.DoesNotExist:
        return f"User with id {user_id} not found."
    except Exception as e:
        # It's good practice to log the exception
        print(f"Failed to send 2FA email to user {user_id}: {e}")
        # Optionally re-raise the exception if you want the task to be marked as 'FAILED'
        # raise e
        return f"Failed to send email for user {user_id}."


@shared_task(name="send_welcome_email_task")
def send_welcome_email_task(company_name, user_code, users, recipient_email):
    """
    Sends a welcome email with user credentials based on a template.
    - company_name: Name of the company
    - user_code: Client code
    - users: A list of dictionaries, where each dictionary contains 'user' and 'pass_user'
    - recipient_email: Email address of the recipient
    """
    try:
        # Construct the path to the template file
        template_path = os.path.join(settings.BASE_DIR, '..\example.txt')

        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()

        # Create the string for users and passwords
        users_section = ""
        for user_info in users:
            users_section += f"{user_info['user']:<12}{user_info['pass_user']}\n"

        # Replace placeholders in the template
        body = template_content.format(
            company_name=company_name,
            user_code=user_code,
            users_section=users_section
        )

        subject = f'Alta de cliente: {company_name}'
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [recipient_email]

        send_mail(subject, body, from_email, recipient_list, fail_silently=False)

        return f"Welcome email sent to {recipient_email}"
    except FileNotFoundError:
        error_message = f"Email template not found at {template_path}"
        print(error_message)
        return error_message
    except Exception as e:
        error_message = f"Failed to send welcome email to {recipient_email}: {e}"
        print(error_message)
        return error_message
