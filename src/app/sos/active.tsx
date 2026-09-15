import SosActiveIcon from "@/assets/icons/arrows-icons/sos-activated-icon.svg";
import { PageLayout } from "@/components/ui/page-layout";
import { SlideButton } from "@/components/ui/slide-button";
import { BrandColors, Spacing, Typography } from "@/constants/theme";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function SosActiveScreen() {
  const router = useRouter();

  const handleStopSOS = () => {
    // TODO:
    // Call the backend to deactivate/stop the active SOS.

    router.replace("/sos");
  };

  return (
    <PageLayout
      title="SOS"
      scrollable={false}
      showBackButton={false}
      backgroundColor={BrandColors.error}
      dividerColor="rgba(255, 255, 255, 0.35)"
      headerTextColor={BrandColors.secondary}
      contentStyle={styles.content}
      footerStyle={styles.footer}
      footer={
        <SlideButton
          label="Slide to stop SOS"
          onComplete={handleStopSOS}
          trackColor="#FFE1E3"
          borderColor="#FFE1E3"
          thumbColor={BrandColors.error}
          labelColor={BrandColors.error}
          arrowColor={BrandColors.secondary}
        />
      }
    >
      <View style={styles.container}>
        {/* MESSAGE */}
        <View style={styles.messageSection}>
          <Text style={[Typography.largeTitle, styles.title]}>
            Slide to stop
          </Text>

          <Text style={[Typography.body, styles.description]}>
            Your location were sent to your emergency{"\n"}
            contacts.
          </Text>
        </View>

        {/* ACTIVE SOS ICON */}
        <View style={styles.iconSection}>
          <SosActiveIcon width={90} height={90} />
        </View>
      </View>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
  },

  container: {
    flex: 1,
  },

  messageSection: {
    alignItems: "center",
  },

  title: {
    color: BrandColors.secondary,
    textAlign: "center",
  },

  description: {
    marginTop: Spacing.three,

    color: BrandColors.secondary,

    textAlign: "center",

    lineHeight: 16,
  },

  iconSection: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  footer: {
    backgroundColor: BrandColors.error,
    borderTopColor: "transparent",

    paddingHorizontal: Spacing.four,
  },
});
