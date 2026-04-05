import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OtpModal from "../components/OtpModal";
import PageLayout from "../../../shared/components/PageLayout";
import { addToast, Button, Card, CardBody, Chip } from "@heroui/react";
import { useUserProfile } from "../hooks/useUserProfile";
import { useUpgradeToAdmin } from "../hooks/useUpgradeToAdmin";
import { useLogout } from "../hooks/useLogout";
import { useDeleteUser } from "../hooks/useDeleteUser.ts";

import DeleteWarning from "../components/DeleteWarning.tsx";

export default function Profile() {
  const { data: user, isLoading: isProfileLoading } = useUserProfile();
  const { mutate, isPending: isUpgradePending } = useUpgradeToAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);
  const { mutate: deleteAccount, isPending: isDeleting } = useDeleteUser();
  const navigate = useNavigate();
  const logout = useLogout();

  const handleUpgradeSubmit = (code: string) => {
    mutate(code, {
      onSuccess: () => {
        setIsModalOpen(false);
        addToast({
          title: "Upgrade Success!",
          description: "Successfully upgraded to admin!",
          color: "success",
          timeout: 3000,
          shouldShowTimeoutProgress: true,
        });
      },
      onError: (err) => {
        addToast({
          title: "Error",
          description: err.message,
          color: "danger",
          timeout: 3000,
          shouldShowTimeoutProgress: true,
        });
      },
    });
  };
  const handleDeleteAccount = () => {
    deleteAccount(user.id, {
      onSuccess: () => {
        addToast({
          title: "Account Deleted",
          description: "Your account has been permanently deleted.",
          color: "success",
          timeout: 3000,
        });

        logout(); // or navigate to landing page
      },
      onError: (err) => {
        addToast({
          title: "Error",
          description: err.message,
          color: "danger",
        });
      },
    });
  }

  if (isProfileLoading)
    return <p className="p-8 text-gray-500">Loading profile...</p>;

  return (
    <PageLayout>
      <div className="flex justify-center mt-10">
        <Card className="w-full max-w-md" shadow="md">
          <CardBody className="px-8 py-8 flex flex-col gap-4">
            <h2 className="text-2xl font-bold">{user.username}</h2>
            <p className="text-gray-500">{user.email}</p>
            <Chip color={user.isAdmin ? "success" : "default"} variant="flat">
              {user.isAdmin ? "Admin" : "User"}
            </Chip>

            <div className="flex flex-col gap-3 mt-4">
              {user.isAdmin ? (
                <Button
                  color="primary"
                  variant="flat"
                  onPress={() => navigate("/admin/manage-users")}
                >
                  View All Users
                </Button>
              ) : (
                <Button
                  color="warning"
                  variant="flat"
                  onPress={() => setIsModalOpen(true)}
                >
                  Upgrade Permissions
                </Button>
              )}
              <Button
                color="danger"
                variant="flat"
                onPress={() => {
                  logout();
                }}
              >
                Log Out
              </Button>
              <Button
                  color="danger"
                  onPress={() => setIsDeleteWarningOpen(true)}
              >
                 Delete Account
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <OtpModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleUpgradeSubmit}
        isLoading={isUpgradePending}
      />
      <DeleteWarning
        isOpen={isDeleteWarningOpen}
        onClose={() => setIsDeleteWarningOpen(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />
    </PageLayout>
  );
}
