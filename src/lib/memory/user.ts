// User identification and management

export function getUserId(): string {
  if (typeof window === 'undefined') {
    // Server-side: generate a temporary ID (should use session/auth in production)
    return 'anonymous-' + Date.now();
  }
  
  // Client-side: use localStorage
  let userId = localStorage.getItem('lobster_user_id');
  if (!userId) {
    userId = 'user-' + crypto.randomUUID();
    localStorage.setItem('lobster_user_id', userId);
  }
  return userId;
}

export function getUserName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('lobster_user_name');
}

export function setUserName(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lobster_user_name', name);
}
