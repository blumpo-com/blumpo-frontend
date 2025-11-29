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

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    awaitingOtp ? verifyOtp : requestOtp,
    { error: '' }
  );

  // Check if we received a success message indicating OTP was sent
  if (state.success && state.awaitingOtp && !awaitingOtp) {
    setAwaitingOtp(true);
  }

  // For OTP verification screen, use a simpler centered layout
  if (awaitingOtp) {
    return (
      <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
            Enter verification code
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit code to your email
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-6" action={formAction}>
            <input type="hidden" name="redirect" value={redirect || ''} />
            <input type="hidden" name="priceId" value={priceId || ''} />
            <input type="hidden" name="email" value={state.email} />
            
            <div>
              <Label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700"
              >
                Verification Code
              </Label>
              <div className="mt-1">
                <Input
                  id="code"
                  name="code"
                  type="text"
                  autoComplete="one-time-code"
                  defaultValue={state.code}
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="appearance-none rounded-[10px] relative block w-full px-6 py-3 border-[3px] border-[#00bfa6] placeholder-gray-500 text-gray-900 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#00bfa6] focus:ring-offset-2"
                  placeholder="000000"
                  autoFocus
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Enter the 6-digit code from your email
              </p>
            </div>

            {state?.error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">
                {state.error}
              </div>
            )}

            <div>
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
                  'Verify Code'
                )}
              </Button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setAwaitingOtp(false)}
                className="text-sm text-[#00bfa6] hover:text-[#00a693]"
              >
                ← Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Main sign-in screen with split layout
  return (
    <div className="bg-gray-50 relative size-full min-h-[100dvh] flex">
      {/* Left side - Decorative background */}
      <div className="absolute h-full left-0 overflow-hidden top-0 w-full lg:w-[60%] hidden lg:block">
        <div className="absolute bg-gray-50 h-[547px] left-[51px] overflow-hidden rounded-[15px] top-1/2 -translate-y-1/2 w-[790px]">
          <div className="absolute flex h-[512.591px] items-center justify-center left-[49.85px] top-[99.13px] w-[569.723px]">
            <div className="flex-none rotate-[151.388deg]">
              <div className="h-[327.266px] relative w-[470.453px]">
                <img 
                  alt="" 
                  className="block max-w-none size-full" 
                  height={327.266} 
                  src={imgVector3} 
                  width={470.453} 
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute contents left-[-25px] top-[500px]">
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
          <div className="absolute h-[361.5px] left-[-25px] top-0 w-[241px]">
            <img 
              alt="" 
              className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" 
              src={imgChatGptImage3Lis2025232050Photoroom1} 
            />
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="absolute bg-gray-50 border-[#040404] border-b-0 border-l-0 lg:border-l border-r-0 border-solid border-t-0 h-full left-0 lg:left-[60%] top-0 w-full lg:w-[40%] flex flex-col items-center justify-center px-4 sm:px-8 lg:px-[58px] py-12 sm:py-20 lg:py-[137px]">
        <div className="w-full max-w-[505px] flex flex-col gap-12 lg:gap-[108px]">
          {/* Title */}
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
                className="bg-[#e6e6e6] box-border flex gap-[27px] h-[60px] items-center justify-center overflow-hidden px-[18px] py-[14px] rounded-[10px] w-full hover:bg-[#d9d9d9] transition-colors"
              >
                <div className="h-[20px] relative shrink-0 w-[20.175px]">
                  <img alt="Google Logo" className="block max-w-none size-full" src={imgLogo} />
                </div>
                <span className="font-medium leading-[17px] text-[#040404] text-[20px] tracking-[0.25px]">
                  Continue with Google
                </span>
              </button>

              {/* OR Divider */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center justify-center relative shrink-0">
                  <div className="flex-none rotate-[180deg]">
                    <div className="h-px relative w-[228px]">
                      <div className="absolute bottom-[-50%] left-0 right-0 top-[-50%]">
                        <img alt="" className="block max-w-none size-full" src={imgLine2} />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="font-medium leading-[24.158px] relative shrink-0 text-[19.895px] text-black text-center tracking-[0.3553px]">
                  OR
                </p>
                <div className="flex items-center justify-center relative shrink-0">
                  <div className="flex-none rotate-[180deg]">
                    <div className="h-px relative w-[228px]">
                      <div className="absolute bottom-[-50%] left-0 right-0 top-[-50%]">
                        <img alt="" className="block max-w-none size-full" src={imgLine2} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Input */}
              <div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={state.email}
                  required
                  maxLength={255}
                  className="appearance-none rounded-[10px] relative block w-full px-[23px] py-[11px] border-[3px] border-[#00bfa6] placeholder-gray-500 text-gray-900 text-[20px] focus:outline-none focus:ring-2 focus:ring-[#00bfa6] focus:ring-offset-2"
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