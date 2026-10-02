import { Pressable, StyleSheet, View } from "react-native";

import { Spacing } from "@/shared/theme";
import type { EmergencyContact } from "@/types/emergency-contact";
import { EmergencyContactItem } from "./emergency-contact-item";

interface EmergencyContactListProps {
  contacts: EmergencyContact[];
  onContactPress: (contact: EmergencyContact) => void;
}

export function EmergencyContactList({
  contacts,
  onContactPress,
}: EmergencyContactListProps) {
  return (
    <View style={styles.container}>
      {contacts.map((contact) => (
        <Pressable key={contact.id} onPress={() => onContactPress(contact)}>
          <EmergencyContactItem
            name={contact.name}
            phoneNumber={contact.phoneNumber}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
});
