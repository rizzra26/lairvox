import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

const SignUpPage = () => {
  return (
    <Suspense fallback={null}>
      <SignUp />
    </Suspense>
  );
};

export default SignUpPage;
