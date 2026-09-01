export type RecoverAccountStep =
  | "verify-identity"
  | "new-phone"
  | "confirm"
  | "complete";

export const RECOVER_FLOW_STEPS: RecoverAccountStep[] = [
  "verify-identity",
  "new-phone",
  "confirm",
];

export const RECOVER_STEP_LABELS: Record<RecoverAccountStep, string> = {
  "verify-identity": "Verify identity",
  "new-phone": "New number",
  confirm: "Confirm",
  complete: "Complete",
};

export function recoverStepIndex(step: RecoverAccountStep): number {
  if (step === "complete") return RECOVER_FLOW_STEPS.length;
  return RECOVER_FLOW_STEPS.indexOf(step);
}

export function recoverStepTitle(step: RecoverAccountStep): string {
  switch (step) {
    case "verify-identity":
      return "Verify your account";
    case "new-phone":
      return "Set up your new number";
    case "confirm":
      return "Confirm number change";
    case "complete":
      return "Recovery complete";
  }
}

export function recoverStepDescription(step: RecoverAccountStep): string {
  switch (step) {
    case "verify-identity":
      return "Enter your registered mobile number and the 6-digit recovery PIN from Account Security.";
    case "new-phone":
      return "Enter your new mobile number and the OTP we send to verify it.";
    case "confirm":
      return "Review the number change below and confirm to finish account recovery.";
    case "complete":
      return "Your login number has been updated. Sign in with your new mobile number.";
  }
}
