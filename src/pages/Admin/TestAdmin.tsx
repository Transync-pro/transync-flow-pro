import { useEffect, useState } from "react";
import { isUserAdmin } from "@/services/blog/users";
import { useNavigate } from "react-router-dom";

const TestAdmin = () => {
  const [status, setStatus] = useState<string>("Checking...");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const isAdmin = await isUserAdmin();
        setStatus(isAdmin ? "✅ You are an admin!" : "❌ You are not an admin");
        
        if (!isAdmin) {
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (error: any) {
        setStatus(`Error: ${error.message}`);
      }
    };

    checkAdmin();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Admin Status Check</h1>
        <p className="text-lg">{status}</p>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold mb-2">Debug Info:</h2>
          <pre className="text-sm bg-gray-800 text-white p-2 rounded overflow-auto">
            {JSON.stringify({
              timestamp: new Date().toISOString(),
              path: window.location.pathname
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default TestAdmin;
