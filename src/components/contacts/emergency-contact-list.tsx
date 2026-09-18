import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { EmergencyContactItem } from "./emergency-contact-item";

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
}

interface EmergencyContactListProps {
  contacts: EmergencyContact[];
}

export function EmergencyContactList({
  contacts,
}: EmergencyContactListProps) {
  return (
    <View style={styles.container}>
      {contacts.map((contact) => (
        <EmergencyContactItem
          key={contact.id}
          name={contact.name}
          phoneNumber={contact.phoneNumber}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
});