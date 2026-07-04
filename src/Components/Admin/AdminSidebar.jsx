import { LayoutDashboardIcon, ListCollapseIcon, ListIcon, PlusSquareIcon, MenuIcon, XIcon } from "lucide-react";
import { assets } from "../../assets/assets";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

function AdminSidebar(){

    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const location = useLocation();

    const user = {
        firstname : "Admin",
        lastname : "User",
        imageUrl : assets.profile,
    }

    const adminNavlinks = [
        {name:"Dashboard", path:"/admin", icon:LayoutDashboardIcon },
        {name:"Add Movies", path:"/admin/add-movies", icon:PlusSquareIcon },
        {name:"List Bookings", path:"/admin/list-bookings", icon:ListIcon },
        {name:"List Movies", path:"/admin/list-movies", icon:ListCollapseIcon }
    ]

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    // Close mobile menu on window resize (desktop)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsMobileOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setIsMobileOpen(!isMobileOpen);
    };

    return (
        <>
            {/* Mobile Menu Toggle Button - Fixed position */}
            <button
                onClick={toggleMobileMenu}
                className="md:hidden fixed bottom-4 right-4 z-50 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dull transition-all duration-300 active:scale-95"
                aria-label="Toggle menu"
            >
                {isMobileOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>

            {/* Sidebar - Desktop */}
            <div className={`
                fixed md:relative z-40
                h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]
                flex flex-col items-center pt-6 md:pt-8
                w-[260px] md:max-w-60 
                border-r border-gray-300/20 bg-[#0a0a0a] md:bg-transparent
                text-sm
                transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                shadow-xl md:shadow-none
            `}>
                {/* User Profile - Mobile Header */}
                <div className="flex items-center gap-3 md:gap-0 md:flex-col w-full px-4 md:px-0">
                    <div className="flex items-center gap-3 md:gap-0 md:flex-col w-full">
                        <img
                            className='h-10 w-10 md:h-14 md:w-14 rounded-full object-cover border-2 border-primary/30'
                            src={user.imageUrl}
                            alt="sidebar"
                            onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${user.firstname}+${user.lastname}&background=6366f1&color=fff&size=56`;
                            }}
                        />
                        <div className="flex flex-col md:items-center md:mt-2">
                            <p className='text-sm md:text-base font-medium text-white'>
                                {user.firstname} {user.lastname}
                            </p>
                            <p className='text-[10px] md:text-xs text-gray-400'>Administrator</p>
                        </div>
                    </div>
                    {/* Close button inside sidebar for mobile */}
                    <button 
                        onClick={toggleMobileMenu}
                        className="md:hidden ml-auto p-1 text-gray-400 hover:text-white"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Divider */}
                <div className="w-4/5 h-px bg-gray-300/20 my-4 md:my-6"></div>

                {/* Navigation Links */}
                <div className='w-full flex-1 overflow-y-auto px-2'>
                    {adminNavlinks.map((link, index) => (
                        <NavLink 
                            key={index} 
                            to={link.path} 
                            end 
                            className={({ isActive }) =>
                            `relative flex items-center justify-center md:justify-start gap-2 md:gap-3 w-full py-3 md:py-2.5 px-3 md:px-4 
                            rounded-lg md:rounded-none transition-all duration-200 text-gray-400 hover:text-white hover:bg-white/5
                            ${isActive ? 'bg-primary/15 text-primary hover:bg-primary/20' : ''}
                            ${index === 0 ? 'md:mt-4' : ''}`
                        }>
                            {({ isActive }) => (
                                <>
                                    <link.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                                    <p className="hidden md:block text-sm font-medium">{link.name}</p>
                                    {/* Mobile tooltip on hover - only for collapsed state */}
                                    <span className="md:hidden text-[10px]">{link.name}</span>
                                    <span className={`w-1 h-8 rounded-r absolute left-0 transition-all duration-300 
                                        ${isActive ? 'bg-primary h-10' : 'h-0'}`}
                                    />
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>

                {/* Footer - Version info */}
                <div className="w-full px-4 py-3 border-t border-gray-300/20 mt-auto">
                    <p className="text-[10px] text-gray-500 text-center">v1.0.0 · Admin Panel</p>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div 
                    className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
                    onClick={toggleMobileMenu}
                />
            )}
        </>
    )
}
export default AdminSidebar;