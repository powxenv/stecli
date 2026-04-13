import {
  Body,
  Container,
  Font,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OtpEmailProps {
  otp: string;
  email: string;
}

export default function OtpEmail({ otp, email }: OtpEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="sans-serif"
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
            format: "woff2",
          }}
          fontWeight={400}
        />
      </Head>
      <Preview>Your Stelagent verification code is {otp}</Preview>
      <Body
        style={{
          backgroundColor: "#0a0a0a",
          color: "#ededed",
          fontFamily: "Inter, sans-serif",
          margin: "0",
          padding: "0",
        }}
      >
        <Container
          style={{
            maxWidth: "480px",
            margin: "0 auto",
            padding: "48px 24px",
          }}
        >
          <Section style={{ marginBottom: "40px" }}>
            <Img
              src="https://stelagent.noval.me/stellar.svg"
              alt="Stelagent"
              width="28"
              height="28"
              style={{ display: "inline-block", verticalAlign: "middle", marginRight: "10px" }}
            />
            <Text
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#ffffff",
                margin: "0",
                letterSpacing: "-0.02em",
                display: "inline",
                verticalAlign: "middle",
              }}
            >
              Stelagent
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: "#141414",
              borderRadius: "16px",
              border: "1px solid #222222",
              padding: "40px 32px",
              marginBottom: "32px",
            }}
          >
            <Text
              style={{
                fontSize: "15px",
                fontWeight: 500,
                color: "#a0a0a0",
                margin: "0 0 8px",
                lineHeight: "1.5",
              }}
            >
              Verification code for
            </Text>
            <Text
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#ffffff",
                margin: "0 0 28px",
                lineHeight: "1.5",
                wordBreak: "break-all",
              }}
            >
              {email}
            </Text>

            <Section
              style={{
                backgroundColor: "#0a0a0a",
                borderRadius: "12px",
                padding: "24px 16px",
                textAlign: "center",
                border: "1px solid #222222",
                marginBottom: "28px",
              }}
            >
              <Text
                style={{
                  fontSize: "11px",
                  fontWeight: 500,
                  color: "#666666",
                  margin: "0 0 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Your code
              </Text>
              <Text
                style={{
                  fontSize: "36px",
                  fontWeight: 700,
                  color: "#ffffff",
                  margin: "0",
                  letterSpacing: "0.15em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {otp}
              </Text>
            </Section>

            <Text
              style={{
                fontSize: "13px",
                color: "#666666",
                margin: "0",
                lineHeight: "1.6",
              }}
            >
              This code expires in{" "}
              <span style={{ color: "#a0a0a0", fontWeight: 600 }}>5 minutes</span>. If you did not
              request this, you can safely ignore this email.
            </Text>
          </Section>

          <Hr
            style={{
              border: "none",
              borderTop: "1px solid #1a1a1a",
              margin: "0 0 24px",
            }}
          />

          <Section>
            <Text
              style={{
                fontSize: "12px",
                color: "#444444",
                margin: "0 0 4px",
                lineHeight: "1.5",
              }}
            >
              Stelagent: Agent-first CLI for Stellar
            </Text>
            <Text
              style={{
                fontSize: "11px",
                color: "#333333",
                margin: "0",
                lineHeight: "1.5",
              }}
            >
              <a
                href="https://stelagent.noval.me"
                style={{
                  color: "#333333",
                  textDecoration: "underline",
                  fontSize: "11px",
                }}
              >
                stelagent.noval.me
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
