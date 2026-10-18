import { Redirect } from 'expo-router';
import React from 'react';

import { useEllie } from '@/store/EllieStore';

/** Sends first-time users through setup, everyone else straight to the ring. */
export default function Index() {
  const { state } = useEllie();
  return <Redirect href={state.onboarded ? '/home' : '/onboarding'} />;
}
