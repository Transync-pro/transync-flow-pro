
import React, { useState, useEffect } from "react";
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
import { CheckCircle, AlertCircle, Loader2, Upload } from "lucide-react";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  createQuickbooksEntity,
  getEntitySchema,
  logOperation
} from "@/services/quickbooksApi";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Simple CSV parsing (in a real app, use a proper CSV parser)
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const rows = text.split('\n');
          const headers = rows[0].split(',').map(h => h.trim());
          
          // Parse data rows
          const data = [];
          for (let i = 1; i < rows.length; i++) {
            if (rows[i].trim()) {
              const rowData = rows[i].split(',').reduce((acc, val, idx) => {
                acc[headers[idx]] = val.trim();
                return acc;
              }, {} as Record<string, string>);
              data.push(rowData);
            }
          }
          
          setHeaderRow(headers);
          setCsvData(data);
        } catch (error) {
          console.error("Error parsing CSV:", error);
          toast({
            title: "CSV Parsing Error",
            description: "Could not parse the CSV file.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  useEffect(() => {
    if (selectedEntity) {
      const schema = getEntitySchema(selectedEntity);
      setMappings(headerRow.map(csvField => ({ csvField, qbField: '' })));
    }
  }, [selectedEntity, headerRow]);

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

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>Select a CSV file containing data to import</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-md p-8 mb-4 cursor-pointer bg-white text-center">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                {file ? `Selected file: ${file.name}` : "Click to upload a CSV file"}
              </Label>
              <Input 
                id="file-upload" 
                type="file" 
                onChange={handleFileChange} 
                accept=".csv"
                className="hidden" 
              />
              {file && <p className="text-sm text-gray-500">{csvData.length} records found</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entity Selection */}
      {csvData.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Configure Import</CardTitle>
            <CardDescription>Map your CSV fields to QuickBooks fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="entity">Select QuickBooks Entity:</Label>
              <Select onValueChange={handleEntityChange}>
                <SelectTrigger className="w-full">
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
            
            {/* Field Mapping */}
            {selectedEntity && headerRow.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Map CSV Fields to QuickBooks Fields</h3>
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
              <Button onClick={handleImport} disabled={importing}>
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
          </CardContent>
        </Card>
      )}

      {/* Import Status */}
      {importStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Import Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p>{importStatus}</p>
              {importing && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(successCount / csvData.length) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {errors.length > 0 && (
              <div>
                <h2 className="text-red-500 font-semibold mb-2">Import Errors</h2>
                <ul className="space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-red-500 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                      Row {error.row}: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {successCount > 0 && (
              <p className="text-green-600 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Successfully imported {successCount} records
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Import;
