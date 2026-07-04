import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";

function AdminNavbar(){
    return(
        <>
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-10 h-14 sm:h-16 border-b border-gray-300/30" >
            <Link to="/admin" className="flex items-center">
                <img 
                    src={assets.a} 
                    alt="TixRush Admin" 
                    className="h-8 sm:h-10 md:h-12 w-auto max-w-[120px] sm:max-w-[180px] md:max-w-[200px] object-contain" 
                />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-400 hidden xs:block">Admin Panel</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs sm:text-sm">
                    A
                </div>
            </div>
        </div>
        </>
    )
}
export default AdminNavbar;