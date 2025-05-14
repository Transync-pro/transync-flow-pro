import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { CSVReader } from "react-papaparse";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  createQuickbooksEntity,
  getEntitySchema,
  getAccessToken,
  getRealmId,
  logOperation
} from "@/services/quickbooksApi";

const Import = () => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headerRow, setHeaderRow] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [mappings, setMappings] = useState<{ csvField: string; qbField: string; }[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState<any[]>([]);
  const { user } = useAuth();
  const { getAccessToken, getRealmId } = useQuickbooks();
  
  const entityOptions = ["Customer", "Invoice", "Item", "Bill"];

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
    },
  });

  useEffect(() => {
    if (selectedEntity) {
      const schema = getEntitySchema(selectedEntity);
      setMappings(headerRow.map(csvField => ({ csvField, qbField: '' })));
    }
  }, [selectedEntity, headerRow]);

  const handleReadCSV = (data: any[]) => {
    if (data && data.length > 0) {
      const header = Object.keys(data[0]);
      setHeaderRow(header);
      setCsvData(data);
    }
  };

  const handleEntityChange = (entity: string) => {
    setSelectedEntity(entity);
  };

  const handleMappingChange = (index: number, qbField: string) => {
    setMappings(prevMappings => {
      const newMappings = [...prevMappings];
      newMappings[index] = { ...newMappings[index], qbField };
      return newMappings;
    });
  };

  const handleImport = async () => {
    if (!file || !selectedEntity || mappings.length === 0) return;
    
    setImporting(true);
    setImportStatus("Preparing import...");
    
    try {
      // Get token and realm ID
      const accessToken = await getAccessToken();
      const realmId = await getRealmId();
      
      if (!accessToken || !realmId) {
        throw new Error("QuickBooks connection not available");
      }

      setImportStatus("Parsing file data...");

      setSuccessCount(0);
      setErrorCount(0);
      setErrors([]);

      const entitySchema = getEntitySchema(selectedEntity);
      const requiredFields = entitySchema?.required || [];

      setImportStatus("Importing records...");

      let currentSuccessCount = 0;
      let currentErrorCount = 0;
      const currentErrors: any[] = [];

      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        try {
          // Map CSV data to QuickBooks entity
          const payload: any = {};
          mappings.forEach(({ csvField, qbField }) => {
            if (qbField) {
              payload[qbField] = row[csvField];
            }
          });

          // Validate required fields
          const missingFields = requiredFields.filter(field => !payload[field]);
          if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
          }

          // Create entity in QuickBooks
          const response = await createQuickbooksEntity(accessToken, realmId, selectedEntity, payload);

          currentSuccessCount++;
          setSuccessCount(currentSuccessCount);

          setImportStatus(`Imported ${currentSuccessCount} of ${csvData.length} records`);
        } catch (error: any) {
          currentErrorCount++;
          setErrorCount(currentErrorCount);
          currentErrors.push({ row: i + 1, message: error.message });
          setErrors(currentErrors);
          console.error(`Error importing record ${i + 1}:`, error);
        }
      }

      setImportStatus("Import complete!");
      toast({
        title: "Import Complete",
        description: `Successfully imported ${currentSuccessCount} records with ${currentErrorCount} errors.`,
      });
      
      // Update this line to use the token and realmId directly:
      await logOperation({
        operationType: "import",
        entityType: selectedEntity,
        recordId: null,
        status: "success",
        details: {
          recordCount: currentSuccessCount,
          errors: currentErrorCount > 0 ? currentErrors : null
        }
      });
    } catch (error: any) {
      console.error("Error during import:", error);
      setImportStatus(`Import failed: ${error.message}`);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
      
      // Update this line to use the token and realmId directly:
      await logOperation({
        operationType: "import",
        entityType: selectedEntity || "unknown",
        recordId: null,
        status: "error",
        details: { error: error.message }
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Import Data to QuickBooks</h1>

      {/* File Upload */}
      <div {...getRootProps()} className="border-2 border-dashed rounded-md p-4 mb-4 cursor-pointer bg-white">
        <input {...getInputProps()} />
        {file ? (
          <p>Selected file: {file.name}</p>
        ) : (
          <p>Drag 'n' drop a CSV file here, or click to select file</p>
        )}
      </div>

      {file && (
        <CSVReader
          file={file}
          header
          skipEmptyLines
          onData={(data) => handleReadCSV(data)}
          onError={(error) => {
            console.error("CSV Parsing Error:", error);
            toast({
              title: "CSV Parsing Error",
              description: error.message,
              variant: "destructive",
            });
          }}
        >
          <span>Parse CSV</span>
        </CSVReader>
      )}

      {/* Entity Selection */}
      {csvData.length > 0 && (
        <div className="mb-4">
          <Label htmlFor="entity">Select QuickBooks Entity:</Label>
          <Select onValueChange={handleEntityChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Entity" />
            </SelectTrigger>
            <SelectContent>
              {entityOptions.map((entity) => (
                <SelectItem key={entity} value={entity}>
                  {entity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Field Mapping */}
      {selectedEntity && headerRow.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Map CSV Fields to QuickBooks Fields</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CSV Field</TableHead>
                <TableHead>QuickBooks Field</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping, index) => (
                <TableRow key={index}>
                  <TableCell>{mapping.csvField}</TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={mapping.qbField}
                      onChange={(e) => handleMappingChange(index, e.target.value)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Import Button */}
      {selectedEntity && mappings.length > 0 && (
        <Button onClick={handleImport} disabled={importing} className="bg-transyncpro-button hover:bg-transyncpro-button/90">
          {importing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            "Import"
          )}
        </Button>
      )}

      {/* Import Status */}
      {importStatus && (
        <div className="mt-4">
          <p>{importStatus}</p>
        </div>
      )}

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="mt-4">
          <h2 className="text-red-500 font-semibold">Import Errors</h2>
          <ul>
            {errors.map((error, index) => (
              <li key={index} className="text-red-500">
                Row {error.row}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Import;
