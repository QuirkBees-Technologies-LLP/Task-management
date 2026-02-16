export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface GeneralProps {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  handleNotificationChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  avatar: string;
  country: string;
  phone: string;
  gender: string;
}
