import { SignIn } from '@clerk/clerk-react';
import './SignInPage.css';

export default function SignInPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <SignIn 
          appearance={{
            elements: {
              rootBox: 'auth-root',
              card: 'auth-card',
              headerTitle: 'auth-title',
              headerSubtitle: 'auth-subtitle',
              socialButtonsBlockButton: 'auth-social-button',
              formButtonPrimary: 'auth-primary-button',
              formFieldInput: 'auth-input',
              footerActionLink: 'auth-link',
            },
            variables: {
              colorPrimary: '#7AE2CF',
              colorBackground: '#06202B',
              colorText: '#F5EEDD',
              colorInputBackground: '#077A7D',
              colorInputText: '#F5EEDD',
            }
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
