import { FeedbackPressable as Pressable } from "@/shared/ui/feedback-pressable";
import { StyleSheet, View } from "react-native";

import { Spacing } from "@/shared/theme";
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
    <View>
      {contacts.map((contact) => (
        <Pressable
          key={contact.id}
          onPress={() => onContactPress(contact)}
          style={styles.row}
          feedbackRadius={0}
          accessibilityRole="button"
          accessibilityLabel={`View ${contact.name}`}
        >
          <EmergencyContactItem
            name={contact.name}
            phoneNumber={contact.phoneNumber}
            profileImage={contact.profileImage}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: "center",
    minHeight: 72,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.two,
  },
});
