import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Trash2, Plus } from "lucide-react";

interface WhitelistEntry {
  id: string;
  username: string;
  uuid: string;
}

interface FileEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FileEditor = ({ open, onOpenChange }: FileEditorProps) => {
  const [fileContent, setFileContent] = useState("# Server Configuration\n\n# Add your server configuration here...");
  const [showWhitelist, setShowWhitelist] = useState(false);
  const [whitelistEntries, setWhitelistEntries] = useState<WhitelistEntry[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newUuid, setNewUuid] = useState("");

  const addWhitelistEntry = () => {
    if (newUsername.trim() && newUuid.trim()) {
      const newEntry: WhitelistEntry = {
        id: Date.now().toString(),
        username: newUsername.trim(),
        uuid: newUuid.trim()
      };
      setWhitelistEntries([...whitelistEntries, newEntry]);
      setNewUsername("");
      setNewUuid("");
    }
  };

  const removeWhitelistEntry = (id: string) => {
    setWhitelistEntries(whitelistEntries.filter(entry => entry.id !== id));
  };

  const handleSave = async () => {
    // TODO: Implementare chiamata API per salvare il contenuto del file e la whitelist
    console.log("Saving file content:", fileContent);
    console.log("Saving whitelist:", whitelistEntries);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset form
    setFileContent("# Server Configuration\n\n# Add your server configuration here...");
    setShowWhitelist(false);
    setWhitelistEntries([]);
    setNewUsername("");
    setNewUuid("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-primary/30 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-accent">
            File Editor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Content Editor */}
          <div>
            <Label htmlFor="fileContent" className="text-primary text-lg font-semibold">
              File Content
            </Label>
            <Textarea
              id="fileContent"
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="mt-2 min-h-[300px] font-mono text-sm"
              placeholder="Enter file content here..."
            />
          </div>

          {/* Whitelist Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="whitelist"
                checked={showWhitelist}
                onCheckedChange={(checked) => setShowWhitelist(checked as boolean)}
              />
              <Label
                htmlFor="whitelist"
                className="text-primary font-semibold cursor-pointer"
              >
                White List
              </Label>
            </div>

            {showWhitelist && (
              <div className="space-y-4 p-4 border border-primary/30 rounded-lg bg-muted/10">
                {/* Add New Entry */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="newUsername" className="text-primary">Username</Label>
                    <Input
                      id="newUsername"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Enter username"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newUuid" className="text-primary">UUID</Label>
                    <Input
                      id="newUuid"
                      value={newUuid}
                      onChange={(e) => setNewUuid(e.target.value)}
                      placeholder="Enter UUID"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={addWhitelistEntry}
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={!newUsername.trim() || !newUuid.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Whitelist Entries */}
                {whitelistEntries.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-primary font-semibold">Whitelist Entries:</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {whitelistEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 border border-primary/20 rounded-md bg-background/50"
                        >
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Username:</span>
                              <div className="text-primary font-medium">{entry.username}</div>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">UUID:</span>
                              <div className="text-primary font-medium font-mono text-xs">{entry.uuid}</div>
                            </div>
                          </div>
                          <Button
                            onClick={() => removeWhitelistEntry(entry.id)}
                            variant="destructive"
                            size="sm"
                            className="ml-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="cyber"
              onClick={handleSave}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};