import { useState, useEffect } from "react";
import { Store, User, Lock, CheckCircle, ShieldCheck, Database } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { updateProfile, changePassword } from "../../api/auth";
import { Card, CardHeader, CardBody, Input, Button, Badge } from "../../components/ui/index";

const SettingsPage = () => {
  const { user } = useAuth();

  // Profile form state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      await updateProfile({ name, email });
      setProfileSuccess("Profile details updated successfully.");
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      setPasswordLoading(false);
      return;
    }

    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordSuccess("Your password has been changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">System & Account Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your grocery store information, personal user credentials, and security settings.
        </p>
      </div>

      {/* Store Information */}
      <Card>
        <CardHeader
          title="Store Information"
          subtitle="Configuration details for your retail outlet."
        />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-start gap-3">
              <Store className="text-green-600 mt-1" size={20} />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Store Name</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{user?.store?.name || "StockWise Grocery"}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-start gap-3">
              <Database className="text-green-600 mt-1" size={20} />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Currency & Timezone</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {user?.store?.currency || "INR (Rs.)"} - {user?.store?.timezone || "Asia/Kolkata"}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Profile Details Form */}
      <Card>
        <CardHeader
          title="Personal Profile"
          subtitle="Update your user account display name and email address."
        />
        <CardBody>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {profileSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                <CheckCircle size={16} /> {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {profileError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-gray-500 font-medium">Assigned Access Role:</span>
              <Badge color="green" className="uppercase font-semibold text-xs">
                {user?.role || "staff"}
              </Badge>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" loading={profileLoading}>
                <User size={15} /> Save Profile Changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Password & Security */}
      <Card>
        <CardHeader
          title="Security & Password"
          subtitle="Ensure your account uses a strong, protected password."
        />
        <CardBody>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
                <CheckCircle size={16} /> {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {passwordError}
              </div>
            )}

            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password (min 6 characters)"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" loading={passwordLoading}>
                <Lock size={15} /> Update Password
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Platform & Inventory Rules */}
      <Card>
        <CardHeader
          title="StockWise Platform Status"
          subtitle="Built-in business logic and active engine settings."
        />
        <CardBody className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="font-semibold text-gray-800">FEFO Valuation Engine</p>
              <p className="text-xs text-green-700 font-medium mt-1">● Active & Enforced</p>
              <p className="text-xs text-gray-400 mt-1">Deducts from oldest expiry batches first</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="font-semibold text-gray-800">Forecast Intelligence</p>
              <p className="text-xs text-green-700 font-medium mt-1">● 5 Algorithms (Auto-Best)</p>
              <p className="text-xs text-gray-400 mt-1">Evaluates MAE, WAPE & Bias metrics</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="font-semibold text-gray-800">Role Authorization</p>
              <p className="text-xs text-green-700 font-medium mt-1">● Owner / Manager / Staff</p>
              <p className="text-xs text-gray-400 mt-1">Granular access to POs and stock writes</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default SettingsPage;