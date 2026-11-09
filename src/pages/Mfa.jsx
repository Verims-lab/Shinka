import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import MfaFlow from "@/components/MfaFlow";
import MfaManage from "@/components/MfaManage";
import { MfaHeader, MfaNotice, MfaScreen, useAppInfo } from "@/components/MfaParts";
import { finishSignIn, resumeMfa, signInWithProvider } from "@/lib/authMfaFlow";
import { safeReturnTo } from "@/lib/authReturnTo";

const PROVIDERS = [
  { id: "google", flag: "enable_google_login", name: "Google" },
  { id: "apple", flag: "enable_apple_login", name: "Apple" },
];

// Base44 template retained; Shinka routes do not activate it. Only approved social providers.
// /mfa: finishes a Google or Apple sign-in that needs a second step
// (?mfa_code=…), and opened directly it is the two-factor authentication settings page.
export default function Mfa() {
  const returnTo = safeReturnTo();
  const [challenge, setChallenge] = useState(null);
  const [managing, setManaging] = useState(null);
  const [resuming, setResuming] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    resumeMfa()
      .then((result) => {
        // A remembered device signs in straight away; otherwise continue the second step here.
        if (result?.access_token) return finishSignIn(result.access_token, returnTo);
        if (result) setChallenge(result);
        setResuming(false);
      })
      .catch((err) => { setError(err); setResuming(false); });
  }, []);

  if (resuming) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <MfaScreen>
      {managing ? <MfaManage session={managing} returnTo={returnTo} />
        : challenge ? <MfaFlow challenge={challenge} returnTo={returnTo} onManage={setManaging} />
        : <ConfirmIdentity returnTo={returnTo} initialError={error} />}
    </MfaScreen>
  );
}

// Changing two-factor settings starts with a fresh sign-in, then a code from an enrolled method.
function ConfirmIdentity({ returnTo, initialError }) {
  const info = useAppInfo();
  const options = info ? info.auth_config || {} : null;
  const [error, setError] = useState(initialError);
  const withProvider = (provider) => signInWithProvider(provider, returnTo, { manage: true }).catch(setError);
  const providers = options ? PROVIDERS.filter((provider) => options[provider.flag] ?? provider.id === "google") : [];

  return (
    <>
      <MfaHeader title={info && `Welcome to ${info.name || "the app"}`} description="Sign in to continue" />
      <MfaNotice error={error} />
      {!options && !error && <Loader2 className="mx-auto w-6 h-6 animate-spin text-muted-foreground" />}
      {options && (
        <div className="space-y-4">
          {providers.map((provider) => (
            <Button key={provider.id} variant="outline" className="w-full h-12 text-sm font-medium" onClick={() => withProvider(provider.id)}>
              {provider.id === "google" && <GoogleIcon className="w-5 h-5 mr-2" />}
              Continue with {provider.name}
            </Button>
          ))}

        </div>
      )}
    </>
  );
}
