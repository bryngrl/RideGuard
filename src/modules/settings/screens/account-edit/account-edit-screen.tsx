import { useTheme } from "@/shared/hooks/use-theme";
import { BorderRadius, Spacing, Typography } from "@/shared/theme";
import { ConfirmationModal, CustomTextInput, PageLayout } from "@/shared/ui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAccountEdit } from "../../hooks/use-account-edit";
import { useProfile } from "../../hooks/use-profile";
export function AccountEditScreen() {
  const router = useRouter();
  const colors = useTheme();
  const { profile } = useProfile();
  const edit = useAccountEdit(profile);
  const [confirm, setConfirm] = useState(false);
  const cancel = () => (edit.changed ? setConfirm(true) : router.back());
  const save = async () => {
    if (await edit.save()) router.back();
  };
  return (
    <PageLayout
      title="Account"
      onBack={cancel}
      footer={
        <View style={styles.buttons}>
          <Pressable
            onPress={cancel}
            style={[styles.cancel, { borderColor: colors.primary }]}
          >
            <Text style={[Typography.button, { color: colors.primary }]}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            disabled={!edit.changed || !edit.valid || edit.saving}
            onPress={save}
            style={[
              styles.save,
              {
                backgroundColor:
                  edit.changed && edit.valid ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[Typography.button, { color: colors.textInverse }]}>
              Save
            </Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[Typography.h2, { color: colors.textInverse }]}>
            {edit.form.firstName.charAt(0).toUpperCase() || "R"}
          </Text>
        </View>
        <Text style={[Typography.h3, { color: colors.text }]}>
          {`${edit.form.firstName} ${edit.form.lastName}`.trim()}
        </Text>
      </View>
      <CustomTextInput
        label="Full name"
        value={`${edit.form.firstName} ${edit.form.lastName}`.trim()}
        onChangeText={(value) => {
          const parts = value.trim().split(/\s+/);
          edit.setField("firstName", parts.shift() ?? "");
          edit.setField("lastName", parts.join(" "));
        }}
      />
      <CustomTextInput
        label="Phone number"
        required
        prefix="+63"
        keyboardType="number-pad"
        maxLength={10}
        value={edit.form.phone}
        onChangeText={(value) => edit.setField("phone", value)}
        error={
          edit.form.phone && !edit.valid
            ? "Enter a valid 10-digit Philippine mobile number."
            : undefined
        }
      />
      <CustomTextInput
        label="Email"
        value={edit.form.email || "Managed by your sign-in provider"}
        editable={false}
      />
      <CustomTextInput
        label="Vehicle"
        value={edit.form.vehicleBrand}
        onChangeText={(value) => edit.setField("vehicleBrand", value)}
      />
      <CustomTextInput
        label="Plate number"
        value={edit.form.plateNumber}
        onChangeText={(value) => edit.setField("plateNumber", value)}
      />
      {edit.error && (
        <Text style={[Typography.bodySmall, { color: colors.error }]}>
          {edit.error}
        </Text>
      )}
      <ConfirmationModal
        visible={confirm}
        title="Discard changes?"
        description="Your edits will be lost."
        primaryButtonText="Discard"
        secondaryButtonText="Keep editing"
        primaryButtonColor={colors.error}
        onPrimaryPress={() => {
          setConfirm(false);
          edit.reset();
          router.back();
        }}
        onSecondaryPress={() => setConfirm(false)}
      />
    </PageLayout>
  );
}
const styles = StyleSheet.create({
  top: { alignItems: "center", gap: Spacing.two, marginBottom: Spacing.three },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  buttons: { flexDirection: "row", gap: Spacing.two },
  cancel: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  save: {
    flex: 1,
    minHeight: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
