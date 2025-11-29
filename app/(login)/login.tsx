'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { requestOtp, verifyOtp } from './actions';
import { ActionState } from '@/lib/auth/middleware';
import { signIn } from 'next-auth/react';
import styles from './login.module.css';

// Figma asset URLs (valid for 7 days - should be downloaded and hosted locally for production)
const imgVector3 = "https://www.figma.com/api/mcp/asset/038af82d-ca64-473e-963d-312d288cfa04";
const imgChatGptImage3Lis2025232050Photoroom1 = "https://www.figma.com/api/mcp/asset/cb53bad9-e39e-47c9-b19f-87985ca00d3f";
const imgLogo = "https://www.figma.com/api/mcp/asset/25cb668c-6767-447a-99e6-bf76cd814dc0";
const imgLine2 = "https://www.figma.com/api/mcp/asset/fc6cafab-ef74-4000-9715-989145be0e38";
const imgLine4 = "https://www.figma.com/api/mcp/asset/b0f913ae-022a-429c-a446-e841933a0850";
const imgVector1 = "https://www.figma.com/api/mcp/asset/7ec896d3-82df-4211-bc6b-85ce63be87d5";
const imgVector2 = "https://www.figma.com/api/mcp/asset/72cd7bd8-0efb-4ea0-9ec6-dcf557143eb5";

export function Login() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
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

  // Shared left panel component
  const LeftPanel = () => (
    <div className={`${styles.frameParent} absolute h-full left-0 top-0 w-full lg:w-[60%] hidden lg:block`}>
      {/* White card with vector background */}
      <div className={styles.wrapperVector3Wrapper}>
        <div className={styles.wrapperVector3}>
          <div className="flex-none rotate-[151.388deg]">
            <div className="h-[327.266px] relative w-[470.453px]">
              <img 
                alt="" 
                className={styles.wrapperVector3Child}
                height={327.266} 
                src={imgVector3} 
                width={470.453} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements and rabbit image */}
      <div className={styles.rabbitImageContainer}>
        {/* Vector decorations */}
        <div className="absolute flex h-[50.878px] items-center justify-center left-[73.41px] top-[36.15px] w-[27.447px]">
          <div className="flex-none rotate-[180deg] scale-y-[-100%]">
            <div className="h-[50.878px] relative w-[27.447px]">
              <img alt="" className="block max-w-none size-full" src={imgVector1} />
            </div>
                </div>
              </div>
        <div className="absolute flex h-[57.088px] items-center justify-center left-[28.92px] top-[32.37px] w-[43.193px]">
          <div className="flex-none rotate-[159.059deg] scale-y-[-100%]">
            <div className="h-[50.878px] relative w-[26.778px]">
              <img alt="" className="block max-w-none size-full" src={imgVector2} />
            </div>
                    </div>
                  </div>
        {/* Rabbit with bottle image */}
        <div className="absolute h-[361.5px] left-[-25px] top-0 w-[241px]">
          <img 
            alt="" 
            className={styles.chatgptImage3Lis2025232}
            src={imgChatGptImage3Lis2025232050Photoroom1} 
                      />
                    </div>
                  </div>
    </div>
  );

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
                <h1 className="font-bold leading-[29.788px] text-[#040404] text-[44px] text-center">
                  Ready to use Blumpo?
                </h1>
                
                <h2 className="font-bold leading-[23.064px] text-[#00bfa6] text-[27.873px] text-center">
                  Enter your verification code
                </h2>
                
                <p className="text-[20px] leading-[23.064px] text-[#888e98] text-center max-w-[505px]">
                  <span className="font-normal">We sent a 6-digit code to </span>
                  <span className="font-bold text-[#040404]">{state.email}</span>
                  <span className="font-normal">. It will expire soon. Please enter it below.</span>
                </p>

                <form id="otp-form" className="w-full flex flex-col gap-[36px] items-center" action={formAction}>
                  <input type="hidden" name="redirect" value={redirect || ''} />
                  <input type="hidden" name="priceId" value={priceId || ''} />
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
                        className={`bg-white border-2 border-black rounded-[9.684px] h-[69px] w-[54.474px] text-center text-[27.999px] font-semibold text-[#040404] focus:outline-none transition-opacity ${
                          !otpCode[index] ? 'opacity-40' : 'opacity-100'
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
                    className="w-full max-w-[505px] flex justify-center items-center h-[60px] rounded-[10px] border-[3px] border-[#00bfa6] text-[20px] font-bold text-white gradient-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00bfa6]"
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
              <h1 className="font-bold leading-[29.788px] text-[#040404] text-[44px] text-center">
                Ready to use Blumpo?
              </h1>

              {/* Form */}
              <div className="w-full">
                <form className="space-y-6" action={formAction}>
                  <input type="hidden" name="redirect" value={redirect || ''} />
                  <input type="hidden" name="priceId" value={priceId || ''} />

                  {/* Google Sign-in Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (redirect) params.set('redirect', redirect);
                      if (priceId) params.set('priceId', priceId);
                      
                      const callbackUrl = `/api/auth/google-callback${params.toString() ? `?${params.toString()}` : ''}`;
                      signIn('google', { callbackUrl });
                    }}
                    className={styles.standrdOutlineCircle}
                  >
                    <img alt="Google Logo" className={styles.logoIcon} src={imgLogo} />
                    <div className={styles.continueWithGoogle}>Continue with Google</div>
                  </button>

                  {/* OR Divider */}
                  <div className={styles.orLine}>
                    <img className={styles.orLineChild} alt="" src={imgLine2} />
                    <div className={styles.or}>OR</div>
                    <img className={styles.orLineChild} alt="" src={imgLine2} />
                  </div>

                  {/* Email Input with gradient border on hover */}
                  <div className={styles.emailInputGradientWrapper}>
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
                  </div>

                  {/* Error Message */}
                  {state?.error && (
                    <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">
                      {state.error}
                    </div>
                  )}

                  {/* Continue Button */}
                  <Button
                    type="submit"
                    className="w-full flex justify-center items-center h-[60px] rounded-[10px] text-[20px] font-bold text-white gradient-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00bfa6]"
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
            <div className="flex h-[17px] items-center justify-center relative shrink-0 w-0">
              <div className="flex-none rotate-[90deg]">
                <div className="h-0 relative w-[17px]">
                  <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
                    <img alt="" className="block max-w-none size-full" src={imgLine4} />
                </div>
                </div>
              </div>
            </div>
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