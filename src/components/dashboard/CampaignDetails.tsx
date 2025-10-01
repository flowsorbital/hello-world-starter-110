import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Phone, Clock, User, FileText, Play, MessageSquare, BarChart3, Download, Volume2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

interface ConversationDetail {
  id: string;
  phone_number: string;
  contact_name?: string;
  status: string; // Conversation status (completed, failed, in_progress, etc.)
  call_successful: string;
  call_duration_secs: number;
  start_time_unix: number;
  conversation_summary: string;
  analysis: any;
  has_audio: boolean;
  additional_fields?: any;
  conversation_id: string;
  dynamic_variables?: any;
}

interface CampaignDetailsProps {
  campaignId: string;
  campaignName: string;
  conversations: ConversationDetail[];
  onBack: () => void;
  isLoading?: boolean;
}

export function CampaignDetails({
  campaignId,
  campaignName,
  conversations,
  onBack,
  isLoading
}: CampaignDetailsProps) {
  const { toast } = useToast();
  const [selectedTranscript, setSelectedTranscript] = useState<ConversationDetail | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<ConversationDetail | null>(null);
  const [selectedDataCollection, setSelectedDataCollection] = useState<ConversationDetail | null>(null);
  const [transcriptData, setTranscriptData] = useState<any[]>([]);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState<string>("");

  // Filter conversations based on phone number search
  const filteredConversations = conversations.filter(conversation => {
    if (!phoneSearchQuery.trim()) return true;
    
    // Remove all non-digit characters for comparison
    const searchDigits = phoneSearchQuery.replace(/\D/g, '');
    const phoneDigits = (conversation.phone_number || '').replace(/\D/g, '');
    
    // Match if the phone number contains the search digits
    return phoneDigits.includes(searchDigits);
  });

  const clearSearch = () => {
    setPhoneSearchQuery("");
  };

  const fetchTranscript = async (conversationId: string) => {
    setLoadingTranscript(true);
    try {
      const { data, error } = await (supabase as any)
        .from('transcripts')
        .select('full_transcript')
        .eq('conversation_id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching transcript:', error);
        setTranscriptData([]);
        return;
      }

      setTranscriptData(data?.full_transcript || []);
    } catch (error) {
      console.error('Error fetching transcript:', error);
      setTranscriptData([]);
    } finally {
      setLoadingTranscript(false);
    }
  };



  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (unix: number) => {
    if (!unix) return 'N/A';
    return format(new Date(unix * 1000), 'MMM dd, yyyy HH:mm');
  };

  const formatDateOnly = (unix: number) => {
    if (!unix) return 'N/A';
    return format(new Date(unix * 1000), 'MMMM dd, yyyy');
  };

  const formatTimeOnly = (unix: number) => {
    if (!unix) return 'N/A';
    return format(new Date(unix * 1000), 'hh:mm a');
  };

  const formatTimeFromStart = (callStartUnix: number, elapsedSeconds: number) => {
    if (!callStartUnix) return `${elapsedSeconds}s`;
    const messageTime = new Date((callStartUnix + elapsedSeconds) * 1000);
    return format(messageTime, 'hh:mm:ss a');
  };

  const getCallStatusBadge = (status: string) => {
    // Map call connection status values (done, failed, etc.)
    const statusMap: { [key: string]: { variant: any; label: string; className?: string } } = {
      'done': { variant: 'default', label: 'Connected', className: 'bg-green-100 text-green-800' },
      'completed': { variant: 'default', label: 'Connected', className: 'bg-green-100 text-green-800' },
      'failed': { variant: 'destructive', label: 'Failed' },
      'in_progress': { variant: 'secondary', label: 'In Progress' },
      'queued': { variant: 'secondary', label: 'Queued' },
      'no_answer': { variant: 'destructive', label: 'No Answer' },
      'busy': { variant: 'destructive', label: 'Busy' },
      'voicemail': { variant: 'secondary', label: 'Voicemail' }
    };

    const statusInfo = statusMap[status?.toLowerCase()] || { variant: 'secondary', label: status || 'Unknown' };
    return <Badge variant={statusInfo.variant} className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const downloadExcel = () => {
    // Prepare data for Excel export including Evaluation & Data Collection
    // Use filtered conversations if there's a search query, otherwise use all conversations
    const dataToExport = phoneSearchQuery ? filteredConversations : conversations;
    const excelData = dataToExport.map(conversation => {
      // Extract evaluation results
      const evaluationResults = conversation.analysis?.evaluation_criteria_results ?
        Object.entries(conversation.analysis.evaluation_criteria_results)
          .map(([key, result]: [string, any]) => `${result.criteria_id}: ${result.result}`)
          .join('; ') : 'N/A';

      // Extract data collection results
      const dataCollectionResults = conversation.analysis?.data_collection_results ?
        Object.entries(conversation.analysis.data_collection_results)
          .map(([key, result]: [string, any]) => `${result.data_collection_id}: ${result.value || 'No value'}`)
          .join('; ') : 'N/A';

      return {
        'Phone Number': conversation.phone_number || 'N/A',
        'Name': conversation.dynamic_variables?.name || conversation.dynamic_variables?.user_name || conversation.additional_fields?.name || 'N/A',
        'Call Status': conversation.call_successful || 'Unknown',
        'Date': formatDateOnly(conversation.start_time_unix),
        'Start Time': formatTimeOnly(conversation.start_time_unix),
        'Duration': formatDuration(conversation.call_duration_secs),
        'Summary': conversation.conversation_summary || 'No summary available',
        'Has Audio': conversation.has_audio ? 'Yes' : 'No',
        'Evaluation Results': evaluationResults,
        'Data Collection Results': dataCollectionResults
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Call Details');

    // Download the file
    const fileName = phoneSearchQuery 
      ? `${campaignName}_call_details_search_${phoneSearchQuery.replace(/\D/g, '')}.xlsx`
      : `${campaignName}_call_details.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const downloadCallRecording = async (conversationId: string) => {
    try {
      // Use Supabase client to invoke the edge function with proper authentication
      const { data, error } = await supabase.functions.invoke('get-conversation-audio', {
        body: { conversationId }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch audio');
      }

      // The function returns the audio stream directly, so we need to handle it as blob
      // Since supabase.functions.invoke doesn't handle binary data well, let's use fetch with auth headers
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`https://opmgrupbwdubxxvpsjng.supabase.co/functions/v1/get-conversation-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ conversationId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the audio blob
      const audioBlob = await response.blob();
      
      // Create a download link
      const downloadUrl = URL.createObjectURL(audioBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `conversation_${conversationId}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Audio Downloaded",
        description: "Call recording has been downloaded successfully.",
      });

    } catch (error: any) {
      console.error('Error downloading audio:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download call recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const playAudio = async (conversationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`https://opmgrupbwdubxxvpsjng.supabase.co/functions/v1/get-conversation-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ conversationId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.play().catch(console.error);
      
      // Clean up when audio ends
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });

      toast({
        title: "Playing Audio",
        description: "Call recording is now playing.",
      });

    } catch (error: any) {
      console.error('Error playing audio:', error);
      toast({
        title: "Playback Failed",
        description: "Failed to play call recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-card rounded-lg p-6 h-32 border border-card-border"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-soft border-card-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call Details
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {phoneSearchQuery ? `${filteredConversations.length} matching calls` : `${conversations.length} total calls`}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={downloadExcel}
              className="gap-2"
              disabled={filteredConversations.length === 0}
            >
              <Download className="h-4 w-4" />
              Download Excel
            </Button>
          </div>
          
          {/* Phone Number Search */}
          <div className="mt-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by phone number..."
                value={phoneSearchQuery}
                onChange={(e) => setPhoneSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {phoneSearchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Additional Fields</TableHead>
                  <TableHead>Call Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Recording</TableHead>
                  <TableHead>Evaluation</TableHead>
                  <TableHead>Data Collection</TableHead>
                  <TableHead>Transcript</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConversations.length > 0 ? filteredConversations.map((conversation) => (
                  <TableRow key={conversation.id}>
                    <TableCell className="font-medium">
                      {conversation.phone_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {conversation.dynamic_variables && Object.keys(conversation.dynamic_variables).length > 0 ? (
                        <div className="max-w-xs space-y-1">
                          {Object.entries(conversation.dynamic_variables)
                            .filter(([key]) => !key.startsWith('system__'))
                            .map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Call Status should show call connection status (done, failed, busy, etc.) */}
                      {getCallStatusBadge(conversation.status)}
                    </TableCell>
                    <TableCell>
                      {formatDateOnly(conversation.start_time_unix)}
                    </TableCell>
                    <TableCell>
                      {formatTimeOnly(conversation.start_time_unix)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatDuration(conversation.call_duration_secs)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48">
                      <div className="truncate" title={conversation.conversation_summary}>
                        {conversation.conversation_summary || 'No summary available'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => playAudio(conversation.conversation_id)}
                          title="Play recording"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadCallRecording(conversation.conversation_id)}
                          title="Download recording"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* Evaluation shows agent evaluation criteria results */}
                      {conversation.analysis?.evaluation_criteria_results ? (
                        <div className="space-y-1">
                          {Object.entries(conversation.analysis.evaluation_criteria_results).map(([key, result]: [string, any]) => (
                            <div key={key} className="flex flex-col gap-1">
                              <div className="text-xs text-muted-foreground">{key}</div>
                              <Badge
                                variant={result.result === 'success' ? 'default' : 'destructive'}
                                className={result.result === 'success' ? 'bg-success text-success-foreground' : ''}
                              >
                                {result.result}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No evaluation</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDataCollection(conversation)}
                        title="View data collection"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTranscript(conversation);
                          fetchTranscript(conversation.conversation_id);
                        }}
                        title="View transcript"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Phone className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {phoneSearchQuery ? 'No calls found matching your search' : 'No calls found'}
                        </p>
                        {phoneSearchQuery && (
                          <Button variant="outline" size="sm" onClick={clearSearch} className="gap-2">
                            <X className="h-4 w-4" />
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Modal */}
      <Dialog open={!!selectedTranscript} onOpenChange={() => {
        setSelectedTranscript(null);
        setTranscriptData([]);
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Call Transcript - {selectedTranscript?.phone_number}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-96">
            {loadingTranscript ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {transcriptData.length > 0 ? (
                  transcriptData.map((message: any, index: number) => (
                    <div key={index} className={`p-3 rounded-lg ${
                      message.role === 'agent' ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={message.role === 'agent' ? 'default' : 'secondary'}>
                          {message.role === 'agent' ? 'Agent' : 'User'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {selectedTranscript && formatTimeFromStart(selectedTranscript.start_time_unix, message.time_in_call_secs)}
                        </span>
                      </div>
                      <p className="text-foreground">{message.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground p-8">
                    No transcript available for this conversation.
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Evaluation Results Modal */}
      <Dialog open={!!selectedEvaluation} onOpenChange={() => setSelectedEvaluation(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Evaluation Results - {selectedEvaluation?.phone_number}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-4 p-4">
              {selectedEvaluation?.analysis?.evaluation_criteria_results && 
                Object.entries(selectedEvaluation.analysis.evaluation_criteria_results).map(([key, result]: [string, any]) => (
                  <div key={key} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{result.criteria_id}</h4>
                      <Badge variant={result.result === 'success' ? 'default' : 'destructive'} 
                             className={result.result === 'success' ? 'bg-success text-success-foreground' : ''}>
                        {result.result}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.rationale}</p>
                  </div>
                ))
              }
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Data Collection Modal */}
      <Dialog open={!!selectedDataCollection} onOpenChange={() => setSelectedDataCollection(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Data Collection - {selectedDataCollection?.phone_number}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-4 p-4">
              {selectedDataCollection?.analysis?.data_collection_results && 
                Object.entries(selectedDataCollection.analysis.data_collection_results).map(([key, result]: [string, any]) => (
                  <div key={key} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{result.data_collection_id}</h4>
                      <Badge variant="outline">{result.value || 'No value'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.rationale}</p>
                  </div>
                ))
              }
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
