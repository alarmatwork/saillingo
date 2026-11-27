export interface CloudUser {
  uid: string;
  name: string;
}

export type Provider = 'google' | 'apple';

/** What sync.js (the separately loaded Firebase bundle) offers to the game. */
export interface Cloud {
  /** Calls back now and whenever someone signs in or out. */
  onUser(cb: (user: CloudUser | null) => void): void;
  /** Opens the provider's sign-in window. */
  signIn(provider: Provider): Promise<void>;
  /** Emails a one-time sign-in link (no password); `returnTo` is the page the link opens. */
  sendEmailLink(email: string, returnTo: string): Promise<void>;
  /**
   * Finishes signing in if `url` is such an emailed link. `askEmail` is used when
   * the link is opened in a browser that does not remember the address.
   * Resolves to true when the link was used.
   */
  completeEmailLink(url: string, askEmail: () => string | null): Promise<boolean>;
  signOut(): Promise<void>;
  /** Proof of who is signed in, for requests made without the SDK; null when nobody is. */
  token(): Promise<string | null>;
  /** The player's saved data, or null if they have none yet. */
  load(uid: string): Promise<unknown>;
  save(uid: string, data: object): Promise<void>;
  /** The anonymous public score used for "TOP x %": XP only. */
  saveScore(uid: string, xp: number): Promise<void>;
}

export type CloudFactory = (config: Record<string, string>) => Cloud;
