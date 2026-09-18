import { loginWithGoogle } from '../api/client.js';

export default function renderHome(root) {
  root.innerHTML = `
    <div class="hero">
      <h1>Discover Movies Differently</h1>
      <p>Search the entire TMDB catalog, build your watchlist, and get AI-powered vibe checks, review summaries, and custom watch pitches for you and your friends.</p>
      
      <div id="google-btn-container" class="g_id_signin" 
        data-type="standard" 
        data-size="large" 
        data-theme="outline" 
        data-text="sign_in_with" 
        data-shape="rectangular" 
        data-logo_alignment="left">
      </div>
    </div>
    
    <div class="features">
      <div class="feature-card">
        <h3>Vibe Checks</h3>
        <p>Get instant, AI-generated breakdowns of what makes a movie good, its pacing, and who it's really for.</p>
      </div>
      <div class="feature-card">
        <h3>Review Consensus</h3>
        <p>Don't want to read 100 reviews? Our AI aggregates user reviews into a short summary of agreements and disagreements.</p>
      </div>
      <div class="feature-card">
        <h3>Friend Pitches</h3>
        <p>Find the perfect movie for movie night. Get an AI pitch tailored to both your watchlists and viewing histories.</p>
      </div>
    </div>
  `;

  // Wait a tick for DOM to update, then initialize Google button.
  // window.GOOGLE_CLIENT_ID is set in index.html. If blank, skip Google button silently.
  setTimeout(() => {
    const clientId = window.GOOGLE_CLIENT_ID;
    if (!clientId) return; // Google login not configured — username/password auth still works.

    if (window.google && window.google.accounts) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: window.handleGoogleCredentialResponse
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-btn-container"),
        { theme: "outline", size: "large", type: "standard" }
      );
    }
  }, 100);

  // Handle the callback from global scope
  const onGoogleLogin = async (e) => {
    try {
      const credential = e.detail.credential;
      await loginWithGoogle(credential);
      location.hash = '#/dashboard';
    } catch (err) {
      console.error(err);
      alert('Google Login Failed: ' + err.message);
    }
  };

  window.addEventListener('google-login', onGoogleLogin, { once: true });

  // Cleanup: remove listener if user navigates away before Google login fires.
  return () => {
    window.removeEventListener('google-login', onGoogleLogin);
  };
}
