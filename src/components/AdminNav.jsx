import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBox, FaWarehouse, FaChartBar, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';

export default function AdminNav() {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: FaHome },
    { path: '/admin/products', label: 'Products', icon: FaBox },
    { path: '/admin/inventory', label: 'Inventory', icon: FaWarehouse },
    { path: '/admin/reports', label: 'Reports', icon: FaChartBar },
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-8">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center py-4 px-2 border-b-2 text-sm font-medium ${
                  isActive(path)
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="mr-2" />
                {label}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-700">
              <FaUser className="mr-2" />
              <span>{user?.name || user?.email || 'Admin'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center py-2 px-3 text-sm font-medium text-red-600 hover:text-red-800"
            >
              <FaSignOutAlt className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 