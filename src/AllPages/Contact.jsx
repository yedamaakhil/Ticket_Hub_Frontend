import React, { useState } from 'react';
import { MapPinIcon, PhoneIcon, MailIcon, SendIcon, MapIcon } from 'lucide-react';
import BlurCircle from '../Components/BlurCircle';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="px-4 sm:px-6 md:px-16 lg:px-40 pt-20 sm:pt-30 md:pt-40 lg:pt-50 pb-12 min-h-screen">
      <BlurCircle top="0" left="0" />
      <BlurCircle bottom="0" right="200px" />

      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Contact Us
        </h1>
        <p className="text-gray-400 mt-2 text-sm sm:text-base">We'd love to hear from you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
        <div className="space-y-5 sm:space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-primary shrink-0" />
                <h3 className="text-white font-semibold text-sm sm:text-base">Visit Us</h3>
              </div>
              <button
                onClick={() => setShowMap(!showMap)}
                className="flex items-center gap-1 text-primary text-xs hover:underline"
              >
                <MapIcon className="w-3 h-3" />
                {showMap ? "Hide Map" : "View Map"}
              </button>
            </div>
            <p className="text-gray-400 text-sm">KPHB Colony, Near KPHB Metro Station</p>
            <p className="text-gray-400 text-sm">Hyderabad - 500072</p>
            <p className="text-gray-400 text-sm">Telangana, India</p>

            {showMap && (
              <div className="mt-4 rounded-lg overflow-hidden h-48 sm:h-64">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15223.456789012345!2d78.3891234!3d17.4923456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb99d5c5e5e5e5%3A0x5e7b8e5c2e5b5e5!2sKPHB%20Colony%2C%20Hyderabad%2C%20Telangana!5e0!3m2!1sen!2sin!4v1699999999999!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  title="KPHB Location Map"
                ></iframe>
              </div>
            )}
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <PhoneIcon className="w-5 h-5 text-primary shrink-0" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Call Us</h3>
            </div>
            <p className="text-gray-400 text-sm">+91 12345 67890</p>
            <p className="text-gray-400 text-sm">+91 98765 43210</p>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <MailIcon className="w-5 h-5 text-primary shrink-0" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Email Us</h3>
            </div>
            <p className="text-gray-400 text-sm break-all">tickethub.online@gmail.com</p>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-5">
          <h3 className="text-white font-semibold mb-4 text-sm sm:text-base">Send us a message</h3>

          {submitted && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-xs sm:text-sm">
              Message sent successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="w-full px-4 py-2.5 sm:py-2 bg-primary/10 border border-primary/20 rounded-lg focus:outline-none focus:border-primary text-white text-sm"
            />

            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="w-full px-4 py-2.5 sm:py-2 bg-primary/10 border border-primary/20 rounded-lg focus:outline-none focus:border-primary text-white text-sm"
            />

            <textarea
              name="message"
              placeholder="Your Message"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              required
              rows="4"
              className="w-full px-4 py-2.5 sm:py-2 bg-primary/10 border border-primary/20 rounded-lg focus:outline-none focus:border-primary text-white text-sm resize-none"
            />

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-primary hover:bg-primary-dull rounded-lg text-sm font-medium transition-all active:scale-95"
            >
              Send Message
              <SendIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;