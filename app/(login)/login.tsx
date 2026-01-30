'use client';

import Link from 'next/link';
import { useActionState, useState, memo } from 'react';
import { useSearchParams } from 'next/navigation';
import { JetpackAdIllustration } from '@/components/jetpack-ad-illustration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { requestOtp, verifyOtp } from './actions';
import { ActionState } from '@/lib/auth/middleware';
import { signIn } from 'next-auth/react';
import styles from './login.module.css';

// Figma asset URLs (valid for 7 days - should be downloaded and hosted locally for production)
const imgVector3 = "https://www.figma.com/api/mcp/asset/4cb293cc-3840-43f5-bab3-792ed7bd3598";

const googleLogo = "/assets/icons/google.svg";


// Memoized Left Panel component - prevents re-renders when form state changes
const LeftPanel = memo(function LeftPanel() {
  return (
    <div className={`${styles.leftPanel}   h-full left-0 top-0 w-full lg:w-[60%] hidden lg:block`}>
      <JetpackAdIllustration className="w-full h-full" />
    </div>
  );
});

export function Login() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const plan = searchParams.get('plan');
  const interval = searchParams.get('interval');
  const websiteUrl = searchParams.get('website_url');
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    awaitingOtp ? verifyOtp : requestOtp,
    { error: '' }
  );

  // Check if we received a success message indicating OTP was sent
  if (state.success && state.awaitingOtp && !awaitingOtp) {
    setAwaitingOtp(true);
  }

  // Handle OTP input changes
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...otpCode];
    newCode[index] = value;
    setOtpCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      const form = document.getElementById('otp-form') as HTMLFormElement;
      if (form) {
        const codeInput = form.querySelector('[name="code"]') as HTMLInputElement;
        if (codeInput) {
          codeInput.value = newCode.join('');
          form.requestSubmit();
        }
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Extract only digits from pasted text
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits.length === 6) {
      // Fill all 6 inputs with the pasted digits
      const newCode = digits.split('');
      setOtpCode(newCode);

      // Focus the last input
      const lastInput = document.getElementById(`otp-5`);
      lastInput?.focus();

      // Auto-submit the form
      setTimeout(() => {
        const form = document.getElementById('otp-form') as HTMLFormElement;
        if (form) {
          const codeInput = form.querySelector('[name="code"]') as HTMLInputElement;
          if (codeInput) {
            codeInput.value = newCode.join('');
            form.requestSubmit();
          }
        }
      }, 0);
    } else if (digits.length > 0) {
      // If less than 6 digits, fill what we have starting from the first input
      const newCode = [...otpCode];
      digits.split('').forEach((digit, i) => {
        if (i < 6) {
          newCode[i] = digit;
        }
      });
      setOtpCode(newCode);

      // Focus the next empty input or the last filled one
      const nextIndex = Math.min(digits.length, 5);
      const nextInput = document.getElementById(`otp-${nextIndex}`);
      nextInput?.focus();
    }
  };


  // Main sign-in screen with split layout
  return (
    <div className="bg-gray-50 relative size-full h-screen overflow-hidden flex">
      <LeftPanel />

      {/* Right side - Form */}
      <div className="absolute bg-gray-50 border-[#040404] border-b-0 border-l-0 lg:border-l border-r-0 border-solid border-t-0 h-full left-0 lg:left-[60%] top-0 w-full lg:w-[40%] flex flex-col items-center justify-center px-4 sm:px-8 lg:px-[58px] py-12 sm:py-20 lg:py-[137px]">
        <div className="w-full max-w-[505px] flex flex-col gap-12 lg:gap-[108px]">
          {awaitingOtp ? (
            <>
              {/* OTP Verification Content */}
              <div className="w-full flex flex-col gap-[41px] items-center">
                <h1 className="font-bold text-[#040404] text-[44px] text-center">
                  Ready to use Blumpo?
                </h1>

                <h2 className="font-bold text-[#00bfa6] text-[27.873px] text-center">
                  Enter your verification code
                </h2>

                <p className="text-[20px] text-[#888e98] text-center max-w-[505px]">
                  <span className="font-normal">We sent a 6-digit code to </span>
                  <span className="font-bold text-[#040404]">{state.email}</span>
                  <span className="font-normal">. It will expire soon. Please enter it below.</span>
                </p>

                <form id="otp-form" className="w-full flex flex-col gap-[36px] items-center" action={formAction}>
                  <input type="hidden" name="redirect" value={redirect || ''} />
                  <input type="hidden" name="website_url" value={websiteUrl || ''} />
                  <input type="hidden" name="plan" value={plan || ''} />
                  <input type="hidden" name="interval" value={interval || ''} />
                  <input type="hidden" name="email" value={state.email} />
                  <input type="hidden" name="code" value={otpCode.join('')} />

                  {/* OTP Input Fields */}
                  <div className="flex items-center justify-between w-full">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otpCode[index]}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className={`bg-white border-2 border-black rounded-[9.684px] h-[69px] w-[54.474px] text-center text-[27.999px] font-semibold text-[#040404] focus:outline-none transition-opacity ${!otpCode[index] ? 'opacity-40' : 'opacity-100'
                          }`}
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>

                  {state?.error && (
                    <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">
                      {state.error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className={styles.continueButton}
                    disabled={pending}
                  >
                    {pending ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                        Loading...
                      </>
                    ) : (
                      'Continue with email'
                    )}
                  </Button>

                  <p className="text-[20px] leading-[9.795px] text-[#040404] text-center">
                    <span className="font-normal">Didn't receive email? </span>
                    <button
                      type="button"
                      onClick={() => setAwaitingOtp(false)}
                      className="text-[#00bfa6] hover:underline font-normal"
                    >
                      Resend it now
                    </button>
                  </p>
                </form>
              </div>
            </>
          ) : (
            <>
              {/* Login Content */}
              <h1 className="font-bold text-[#040404] text-[44px] text-center">
                Welcome to Blumpo!
              </h1>

              {/* Form */}
              <div className="w-full">
                <form className="space-y-6" action={formAction}>
                  <input type="hidden" name="redirect" value={redirect || ''} />
                  <input type="hidden" name="website_url" value={websiteUrl || ''} />
                  <input type="hidden" name="plan" value={plan || ''} />
                  <input type="hidden" name="interval" value={interval || ''} />

                  {/* Google Sign-in Button */}
                  <button
                    type="button"
                    onClick={() => {
                      // Store redirect params in a cookie to preserve through OAuth flow
                      if (redirect || plan || interval || websiteUrl) {
                        const params = new URLSearchParams();
                        if (redirect) params.set('redirect', redirect);
                        if (plan) params.set('plan', plan);
                        if (interval) params.set('interval', interval);
                        if (websiteUrl) params.set('website_url', websiteUrl);

                        // Set cookie that will be read by the redirect callback
                        document.cookie = `oauth_redirect=${params.toString()}; path=/; max-age=300; SameSite=Lax`;
                      }

                      // Use NextAuth's default callback - redirect callback will read the cookie
                      signIn('google');
                    }}
                    className={styles.googleButton}
                  >
                    <img alt="Google Logo" className={styles.googleLogo} src={googleLogo} loading="eager" key="logo" />
                    <span className={styles.googleButtonText}>Continue with Google</span>
                  </button>

                  {/* or Divider */}
                  <div className={styles.orDivider}>
                    <div className={styles.orLine}></div>
                    <span className={styles.orText}>or</span>
                    <div className={styles.orLine}></div>
                  </div>

                  {/* Email Input */}
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={state.email}
                    required
                    maxLength={255}
                    className={styles.emailInput}
                    placeholder="Email..."
                  />

                  {/* Error Message */}
                  {state?.error && (
                    <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">
                      {state.error}
                    </div>
                  )}

                  {/* Continue Button */}
                  <Button
                    type="submit"
                    className={styles.continueButton}
                    disabled={pending}
                  >
                    {pending ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                        Loading...
                      </>
                    ) : (
                      'Continue with email'
                    )}
                  </Button>
                </form>
              </div>
            </>
          )}

          {/* Footer Links */}
          <div className="flex items-center justify-center gap-2">
            <Link
              href="/privacy-policy"
              className="font-normal leading-[8.937px] text-[#040404] text-[14.894px] hover:text-[#00bfa6] transition-colors"
            >
              Privacy policy
            </Link>
            <span className="h-4 w-px shrink-0 bg-[#000000]" aria-hidden />
            <Link
              href="/terms"
              className="font-normal leading-[8.937px] text-[#040404] text-[14.894px] hover:text-[#00bfa6] transition-colors"
            >
              Terms & conditions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}