"use client";

import { createAuthClient } from "better-auth/react";
import { getAppUrl } from "./app-url.js";

export const authClient = createAuthClient({
  baseURL: getAppUrl(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
