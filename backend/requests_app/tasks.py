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
