"use client";
import {
  Box,
  Flex,
  Input,
  Message,
  Panel,
  Button,
  Switch,
} from "@bigcommerce/big-design";
import { AddIcon, AssignmentIcon } from "@bigcommerce/big-design-icons";
import { useEffect, useState } from "react";
import Loading from "../components/loading";
import { useShop } from "../contexts/ShopContext";
import { Editor } from "@monaco-editor/react";
import Header from "../components/header";
import { useRouter } from "next/navigation";

const MAX_LENGTH = 5000;

interface SettingsData {
  enableShare: boolean;
  designerButtonName: string;
  designerButton: string;
  addtocartForm: string;
  cssCode: string;
}

const Settings = () => {
  const { shop } = useShop();
  const router = useRouter();

  useEffect(() => {
    if (!shop) { router.push('/'); return; }
  }, [shop]);

  const [settings, setSettings] = useState<SettingsData>({
    enableShare: false,
    designerButtonName: "Customize",
    designerButton: "",
    addtocartForm: "",
    cssCode: ".example-css-custom{color:red;}",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageSuccess, setPageSuccess] = useState("");
  const [pageError, setPageError] = useState("");
  const [cssError, setCssError] = useState("");

  const getSettings = async () => {
    if (!shop) {
      setPageError("Shop information is missing");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/settings/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load settings");
      }

      // Ensure all values are strings, not null
      setSettings({
        enableShare: result.data?.enableShare || false,
        designerButtonName: result.data?.designerButtonName || "Customize",
        designerButton: result.data?.designerButton || "",
        addtocartForm: result.data?.addtocartForm || "",
        cssCode: result.data?.cssCode || ".example-css-custom{color:red;}",
      });
    } catch (error: any) {
      console.error("Error loading settings:", error);
      setPageError(error.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSettings();
  }, [shop]);

  const handleToggleShare = () => {
    setSettings((prev) => ({
      ...prev,
      enableShare: !prev.enableShare,
    }));
  };

  // const handleInputChange =
  //   (field: keyof SettingsData) => (e: React.ChangeEvent<HTMLInputElement>) => {
  //     setSettings((prev) => ({
  //       ...prev,
  //       [field]: e.target.value || "", // Ensure empty string instead of null
  //     }));
  // };


  const handleInputChange =
    (field: keyof SettingsData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const hasHtml = /<[^>]*>/.test(value);
      const cleanValue = value.replace(/<[^>]*>/g, '');
      setSettings((prev) => ({
        ...prev,
        [field]: cleanValue || "",
      }));
  };
  

  const validateCss = (value: string | undefined): string => {
    if (!value) return "";

    if (value.length > MAX_LENGTH) {
      return `CSS exceeds ${MAX_LENGTH} characters`;
    }

    // Check for HTML tags
    const hasHtmlTags = /<[^>]*>/.test(value);
    if (hasHtmlTags) {
      return "HTML tags are not allowed in CSS";
    }

    // Define dangerous patterns that could execute code
    const dangerousPatterns = [
      { pattern: /javascript:/i, message: "JavaScript URLs are not allowed" },
      { pattern: /data:text\/html/i, message: "Data URLs with HTML are not allowed" },
      { pattern: /expression\(/i, message: "CSS expressions are not allowed" },
      { pattern: /eval\(/i, message: "eval function is not allowed" },
      { pattern: /<script/i, message: "Script tags are not allowed" },
      { pattern: /onload=/i, message: "onload events are not allowed" },
      { pattern: /onerror=/i, message: "onerror events are not allowed" },
      { pattern: /onclick=/i, message: "onclick events are not allowed" },
      { pattern: /url\(['"]?data:/i, message: "Data URLs in url() are not allowed" },
      { pattern: /@import\s+url\(/i, message: "URL imports are not allowed" },
    ];

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(value)) {
        return `Unsafe CSS: ${message}`;
      }
    }

    return "";
  };

  const handleCssChange = (value: string | undefined) => {
    const safeValue = value || ""; // Convert undefined to empty string
    const error = validateCss(safeValue);
    setCssError(error);
    setSettings((prev) => ({
      ...prev,
      cssCode: safeValue,
    }));
  };

  const handleSaveSettings = async () => {
    if (!shop) {
      setPageError("Shop information is missing");
      return;
    }

    if (cssError) {
      setPageError("Please fix CSS errors before saving");
      return;
    }

    setSaving(true);
    setPageError("");
    setPageSuccess("");

    try {
      const response = await fetch(`/api/settings/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop,
          enableShare: settings.enableShare,
          designerButtonName: settings.designerButtonName || "Customize",
          designerButton: settings.designerButton || "",
          addtocartForm: settings.addtocartForm || null,
          cssCode: settings.cssCode || "",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save settings");
      }

      setPageSuccess(result.message || "Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setPageError(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header />

      {loading ? (<Panel><Loading /></Panel>) : 

        <Panel id="settings">
          <h2 style={{ margin: "0 0 20px 0", display:'flex', alignItems:'center', gap:'10px'}}>
            <AssignmentIcon /> General Settings
          </h2>

          {pageError && (
            <Message
              marginVertical="medium"
              messages={[{ text: pageError }]}
              onClose={() => setPageError("")}
              type="error"
              style={{ marginBottom: "20px" }}
            />
          )}

          {pageSuccess && (
            <Message
              messages={[{ text: pageSuccess }]}
              marginVertical="medium"
              onClose={() => setPageSuccess("")}
              type="success"
              style={{ marginBottom: "20px" }}
            />
          )}

          <Panel>
            <Flex justifyContent="space-between" alignItems="center">
              <Box style={{marginTop:'-15px'}}>
                Enable share button{" "}
                <span style={{ color: "#666", fontSize: "0.9em" }}>
                  (Coming Soon)
                </span>
              </Box>
              <Switch
                disabled
                checked={settings.enableShare}
                onChange={handleToggleShare}
              />
            </Flex>
          </Panel>

          <Panel>
            <Box style={{marginTop:'-15px'}}>
              <Input
                label="Customize button name"
                description="The 'Customize' name will be displayed by default if you don't specify a button name."
                required
                value={settings.designerButtonName}
                placeholder="e.g., Design Now, Customize Product"
                width="medium"
                maxLength={30}
                onChange={handleInputChange("designerButtonName")}
              />
            </Box>
          </Panel>

          <Panel>
            <Box style={{marginTop:'-15px'}}>
              <Input
                label="Custom selector for Customize Designer button"
                description="Enter the class or ID of the location where you want the button (if using a custom theme)."
                value={settings.designerButton}
                placeholder="e.g., .add-to-cart-buttons, #product-actions"
                width="medium"
                maxLength={200}
                onChange={handleInputChange("designerButton")}
              />
            </Box>
          </Panel>

          <Panel>
            <Box style={{marginTop:'-15px'}}>
              <Input
                label="Product add-to-cart form selector"
                description="If your theme's add-to-cart function doesn't work, add your product form selector here (e.g., .product-form .form)"
                value={settings.addtocartForm}
                placeholder="e.g., .product-form .form"
                width="medium"
                maxLength={200}
                onChange={handleInputChange("addtocartForm")}
              />
            </Box>
          </Panel>

          <Panel>
            <Box marginBottom="small" style={{marginTop:'-15px'}}>
              <strong>Custom CSS</strong>
              <Box style={{ fontSize: "0.9em", color: "#666", marginTop: "5px" }}>
                Add custom CSS styles for the designer (max {MAX_LENGTH}{" "}
                characters)
              </Box>
            </Box>

            {/* Monaco Editor */}
            <Editor
              height="200px"
              defaultLanguage="css"
              value={settings.cssCode}
              onChange={handleCssChange}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />

            <Box marginTop="small" style={{ fontSize: "0.9em", color: "#666" }}>
              Characters: {settings.cssCode?.length || 0}/{MAX_LENGTH}
            </Box>

            {cssError && (
              <Message
                marginVertical="small"
                messages={[{ text: cssError }]}
                type="error"
              />
            )}
          </Panel>

          <Box style={{ margin: "20px 0 0 0" }}>
            <Button
              variant="primary"
              onClick={handleSaveSettings}
              isLoading={saving}
              disabled={!!cssError}
            >
              <AddIcon /> Save Settings
            </Button>
          </Box>
        </Panel>
      }
    </>
  );
};

export default Settings;
