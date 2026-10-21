import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { StyleSheet, View } from "react-native";

import { BorderRadius, Spacing } from "@/shared/theme";
import type { EmergencyContact } from "../types/emergency-contact.types";
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
        <Pressable
          key={contact.id}
          onPress={() => onContactPress(contact)}
          style={styles.row}
          feedbackRadius={BorderRadius.sm}
          accessibilityRole="button"
          accessibilityLabel={`View ${contact.name}`}
        >
          <EmergencyContactItem
            name={contact.name}
            phoneNumber={contact.phoneNumber}
            relationship={contact.relationship}
            profileImage={contact.profileImage}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    marginHorizontal: -Spacing.four,
  },
  row: {
    borderRadius: BorderRadius.sm,
    minHeight: 72,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
});
