import { Pressable, StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { EmergencyContactItem } from "./emergency-contact-item";
import type { EmergencyContact } from "@/types/emergency-contact";

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
        <Pressable
          key={contact.id}
          onPress={() => onContactPress(contact)}
        >
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