import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { FaDownload, FaChartLine, FaChartBar, FaChartPie, FaUserShield } from 'react-icons/fa';
import { adminAPI } from '../../services/adminAPI';
import toast from 'react-hot-toast';
import AdminNav from '../../components/AdminNav';

export default function Reports() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchReports();
    }
  }, [isAdmin, dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch sales report
      const salesResponse = await adminAPI.getSalesReport({
        startDate: dateRange.start,
        endDate: dateRange.end
      });
      setSalesData(salesResponse.data);

      // Fetch inventory report
      const inventoryResponse = await adminAPI.getInventoryReport();
      setInventoryData(inventoryResponse.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to fetch reports. Please try again.');
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const downloadReport = async (type) => {
    try {
      let response;
      switch (type) {
        case 'sales':
          response = await adminAPI.getSalesReport({
            startDate: dateRange.start,
            endDate: dateRange.end,
            format: 'csv'
          });
          break;
        case 'inventory':
          response = await adminAPI.getInventoryReport({ format: 'csv' });
          break;
        default:
          return;
      }

      // Create and download file
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded successfully`);
    } catch (err) {
      console.error(`Error downloading ${type} report:`, err);
      toast.error(`Failed to download ${type} report`);
    }
  };

  // Redirect if not admin
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      <AdminNav />
      
      {/* Admin Banner */}
      <div className="bg-blue-600 text-white py-3 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <FaUserShield className="text-xl mr-2" />
            <span className="font-medium">Admin Dashboard</span>
          </div>
          <div className="text-sm">
            Welcome, {user?.userName || user?.email || 'Admin'}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Reports</h1>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="start"
                value={dateRange.start}
                onChange={handleDateRangeChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="end"
                value={dateRange.end}
                onChange={handleDateRangeChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading reports...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : (
          <>
            {/* Sales Report */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Sales Report</h2>
                <button
                  onClick={() => downloadReport('sales')}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center"
                >
                  <FaDownload className="mr-2" /> Download CSV
                </button>
              </div>

              {salesData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FaChartLine className="text-blue-500 text-2xl mr-2" />
                      <div>
                        <h3 className="text-lg font-medium text-blue-800">Total Sales</h3>
                        <p className="text-2xl font-bold text-blue-600">
                          ${salesData.totalSales.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FaChartBar className="text-green-500 text-2xl mr-2" />
                      <div>
                        <h3 className="text-lg font-medium text-green-800">Orders</h3>
                        <p className="text-2xl font-bold text-green-600">
                          {salesData.totalOrders}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FaChartPie className="text-purple-500 text-2xl mr-2" />
                      <div>
                        <h3 className="text-lg font-medium text-purple-800">Average Order Value</h3>
                        <p className="text-2xl font-bold text-purple-600">
                          ${(salesData.totalSales / salesData.totalOrders).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Inventory Report */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Inventory Report</h2>
                <button
                  onClick={() => downloadReport('inventory')}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center"
                >
                  <FaDownload className="mr-2" /> Download CSV
                </button>
              </div>

              {inventoryData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FaChartBar className="text-blue-500 text-2xl mr-2" />
                      <div>
                        <h3 className="text-lg font-medium text-blue-800">Total Products</h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {inventoryData.totalProducts}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FaChartPie className="text-red-500 text-2xl mr-2" />
                      <div>
                        <h3 className="text-lg font-medium text-red-800">Low Stock Items</h3>
                        <p className="text-2xl font-bold text-red-600">
                          {inventoryData.lowStockItems}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FaChartLine className="text-green-500 text-2xl mr-2" />
                      <div>
                        <h3 className="text-lg font-medium text-green-800">Total Stock Value</h3>
                        <p className="text-2xl font-bold text-green-600">
                          ${inventoryData.totalStockValue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 