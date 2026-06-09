import { assets } from "../assets/assets";

function Footer() {
  return (
    <footer className="bg-gradient-to-b from-black via-black to-red-950/80 w-full text-white pt-8 lg:pt-12 px-4 sm:px-8 md:px-16 lg:px-28 overflow-hidden mt-12 lg:mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-6 gap-8 md:gap-12">
        {/* Brand Section */}
        <div className="lg:col-span-3 space-y-6">
          <a href="https://prebuiltui.com" className="block">
            <img className='h-25 w-80' src={assets.a} alt="" />
          </a>
          <p className="text-sm/6 text-neutral-300 max-w-96">TicketHub helps you Books your tickets faster than ever before. Easy & Convenient also have a great selection of movies and shows.
          <br /> Enjoy the best movie experience! </p>
          <div className="flex gap-5 md:gap-6 order-1 md:order-2">
            {/* X (Twitter) */}
            <a href="#" className="text-white hover:text-red-400 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
              </svg>
            </a>
            {/* Github */}
            <a href="#" className="text-white hover:text-red-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
            {/* Linkedin */}
            <a href="#" className="text-white hover:text-red-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            {/* Youtube */}
            <a href="#" className="text-white hover:text-red-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" />
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" className="text-white hover:text-red-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
            </a>
          </div>
             <div className="flex items-center gap-2 mt-4">
                  <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/refs/heads/main/assets/appDownload/googlePlayBtnBlack.svg" alt="google play" className="h-10 w-auto border border-white rounded" />
                  <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/refs/heads/main/assets/appDownload/appleStoreBtnBlack.svg" alt="app store" className="h-10 w-auto border border-white rounded" />
              </div>
        </div>

        {/* Links Sections */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 lg:gap-28 items-start">
          {/* Products */}
          <div>
            <h3 className="font-medium text-sm mb-4 text-white">Company</h3>
            <ul className="space-y-3 text-sm text-neutral-300">
              <li><a href="/home" className="hover:text-red-400 transition-colors">Home</a></li>
              <li className="flex items-center gap-2">
                <a href="/careers" className="hover:text-red-400 transition-colors">Careers</a>
              </li>
              <li><a href="/privacy-policy" className="hover:text-red-400 transition-colors">Privacy policy</a></li>
              <li><a href="/about" className="hover:text-red-400 transition-colors">About</a></li>
              <li><a href="/contact" className="hover:text-red-400 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-medium text-sm mb-4 text-white">Resources</h3>
            <ul className="space-y-3 text-sm text-neutral-300">
              <li><a href="/movies" className="hover:text-red-400 transition-colors">Movies</a></li>
              <li><a href="/favourites" className="hover:text-red-400 transition-colors">Favourites</a></li>
              <li><a href="/theaters" className="hover:text-red-400 transition-colors">Theaters</a></li>
              <li><a href="/my-bookings" className="hover:text-red-400 transition-colors">My Bookings</a></li>
              <li><a href="/store" className="hover:text-red-400 transition-colors">Store</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-medium text-sm mb-4 text-white">Get in Touch</h3>
            <ul className="space-y-3 text-sm text-neutral-300">
              <li><a href="#" className="hover:text-red-400 transition-colors">+91 1234567890</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors">support@tickethub.com</a></li>
              <li>
                  <a href="https://www.google.com/maps/place/10000coders" className="hover:text-red-400 transition-colors">Road 3 Kphb | Hyderabad | <br /> Telangana | 500072 <br /> India</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-12 pt-4 border-t border-red-900/50 flex justify-between items-center">
        <p className="text-neutral-400 text-sm">© 2026 <b>Ticket Hub</b> All right reserved.</p>
      </div>

      {/* Brand watermark and background glow */}
      <div className="relative">
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl h-full max-h-64 bg-red-600/30 rounded-full blur-[170px] pointer-events-none" />
        <h3 className="text-center font-extrabold leading-[0.7] text-transparent text-[clamp(3rem,15vw,15rem)] [-webkit-text-stroke:1px_#450a0a] mt-6" >
          TicketHub
        </h3>
      </div>
    </footer>
  );
}

export default Footer;