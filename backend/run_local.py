#!/usr/bin/env python3
"""
Local development server runner.
Uses SQLite database and local configuration.
"""

import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set environment variables for local development
os.environ['FLASK_ENV'] = 'development'
os.environ['DATABASE_URL'] = 'sqlite:///app.db'
os.environ['SECRET_KEY'] = 'local-development-secret-key'

# Firebase configuration (using production values for local testing)
os.environ['FIREBASE_PROJECT_ID'] = 'collabcanvas-24-mvp'
os.environ['FIREBASE_CLIENT_EMAIL'] = 'firebase-adminsdk-fbsvc@collabcanvas-24-mvp.iam.gserviceaccount.com'
os.environ['FIREBASE_PRIVATE_KEY_ID'] = '70025e873e41f61c9eb4137038b1d420a669626b'
os.environ['FIREBASE_PRIVATE_KEY'] = '-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC56nl49eeKf2VY\\nInaDNMSojgjQOxF5n4Ex1TNe3tcwYEMkTIrO+y7hqsewL+xeXFP53ueWuzOMWfGE\\n6DkOvVOTwXtB33JpeLZo0Iww5uRfsBlJX5M0E+/lImi7xwBnLdd9bcjHmMAvvhS4\\nL21tuv7NWR2j2khQ5kFsg40xUJMzRAWOt5Yp8tWsu3iRk7eoS+xZDCQwoYERlTGm\\nyN3sKcY6U/AdnJkWVO5crWc40xjDnOgk5mkLyLW9XI4KPTh1vMqYKild/gkJ8Qe5\\niRxa1hFAK1+Fv+nofuNwW4wV+kbuzo3VI+8g+bPKBABQvRy3G4v2bY1dlN7xD0x0\\ntQklKb9fAgMBAAECggEADqLyiD7XyTQJXvxrlx3G47w23mngENKpYap2vl/N0i2p\\n64gpH21v/e0rhmfndHBRXikZ02iOgNyt4nhD0bC/DTFcyk1UnRAXUD4m40yyKwRa\\noUeod5+gMcpZM3tRwU2/Gs1TUr9oVfnheLSnKU3g9HqxFi6/pbrS6L+clIbS5+Sv\\nL4H54aWj56QEoPrgDAw2uRRBpHJ+RWraoGbHE7NFRVyrJ9DAUBp6iehtiKq3DrK4\\nIbXhASHS1EXWBbuQPs6wh+o8pmoljJfq0pp7oPgSziqBGclwYWONaN6Ggep7rEkh\\nw4+WUKTrT2hqpnOcobbfU9//FjCcL92tWQYkl0GgKQKBgQDauHMC/v9RaE4mZ2XJ\\nSxkXCA1MiKA8DLKcWgIpa7noFV7od9CtN2T6Gjj4x/ik4RNrMCkIvZZ04R4E9D+Y\\nfs65dROWpmx125GLcw8Y7vcE4KNG9UPExpoGz0A2NUukv0OaSfxg+hnR/FKra38P\\n2wQrYFGV54B7pAv1An9tSpe1ZwKBgQDZmqUPoF6J1dWHTg1uNOV9zUmhHendP8ZG\\nPzxGLc6c/YoN5nPR1Dr34yRNcNDwmiG/OSlOyj90Fdd3RRkWzd/70j+acygXLQKb\\nL5An6s6P0nRcIOsuGMrlsDfrzIm9HVFxSfCo9V6oAg1rFLaKn4iG+lHnB1lcpz+q\\nXw7AuXCzSQKBgQCXFejkve7ydiHd53jpZsXrIfXF028UbBUJaie0Iy8lgXWxEesF\\nbImFNo36VHCOvKekWH1P+16uWD9bXrl3hsUYWSZx3352n3jXomBgcdoS9XX0c0If\\n8Ky/XXTWvVQGdtSlBMyg1ML3Sdx1a2k3M6yapgtViLg5MGXOFq6deXR4qwKBgBaD\\nBSiEssMXuCtzS7hnCIbnQgLFEXiuLFkAGcA45PMg17Nwb/L5PdB/UzYfwb3idDNQ\\nOpHIIqBj0hKot1vAmLd4nNPhrfgX0/kyBnvastv2LcuKLEpsjjEM9fwTAPzrl41c\\n1OTl3ZEMBU9aqTfWIU21f9uiyv/m3ZNGmkQd6ybhAoGAOzS1LY4Z6otzjfHkFV+z\\nVgJeDOhalk5apvRIGychrducvkXJ8EH4uq31RYN6B3BVg5zDojWF2ak+9gYH2Op6\\nFUWkvEMWAqEB73u/NwTyNPLxiqbdn2FAQ5SVHh4XDH4r9+8vuovrssppH3a2/5WG\\nK+yH/XKNSsWqgM31mOq51co=\\n-----END PRIVATE KEY-----'
os.environ['FIREBASE_CLIENT_ID'] = '113427911244146012632'
os.environ['FIREBASE_AUTH_URI'] = 'https://accounts.google.com/o/oauth2/auth'
os.environ['FIREBASE_TOKEN_URI'] = 'https://oauth2.googleapis.com/token'
os.environ['FIREBASE_AUTH_PROVIDER_X509_CERT_URL'] = 'https://www.googleapis.com/oauth2/v1/certs'
os.environ['FIREBASE_CLIENT_X509_CERT_URL'] = 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40collabcanvas-24-mvp.iam.gserviceaccount.com'

# CORS origins for local development
os.environ['CORS_ORIGINS'] = 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:5173'

if __name__ == '__main__':
    from app import create_app
    from config_local import LocalConfig
    
    app = create_app(LocalConfig)
    
    print("Starting local development server...")
    print("Backend: http://localhost:5000")
    print("Health check: http://localhost:5000/health")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        use_reloader=True
    )
