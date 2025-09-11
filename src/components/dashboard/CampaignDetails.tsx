import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Phone, Clock, User, FileText, Play, MessageSquare, BarChart3 } from "lucide-react";
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

interface ConversationDetail {
  id: string;
  phone_number: string;
  contact_name: string;
  call_successful: string;
  call_duration_secs: number;
  start_time_unix: number;
  conversation_summary: string;
  analysis: any;
  has_audio: boolean;
  additional_fields?: any;
  conversation_id: string;
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
  const [selectedTranscript, setSelectedTranscript] = useState<ConversationDetail | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<ConversationDetail | null>(null);
  const [selectedDataCollection, setSelectedDataCollection] = useState<ConversationDetail | null>(null);
  const [transcriptData, setTranscriptData] = useState<any[]>([]);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

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

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return <Badge variant="default" className="bg-success text-success-foreground">Success</Badge>;
    }
    return <Badge variant="destructive">Failed</Badge>;
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

  const playCallRecording = async (conversationId: string) => {
    // This would call the ElevenLabs audio endpoint
    console.log('Playing audio for conversation:', conversationId);
    // Implementation would fetch audio from https://api.elevenlabs.io/v1/convai/conversations/:conversation_id/audio
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
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Campaigns
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                {campaignName} - Call Details
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {conversations.length} total calls
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Recording</TableHead>
                  <TableHead>Transcript</TableHead>
                  <TableHead>Evaluation</TableHead>
                  <TableHead>Data Collection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conversation) => (
                  <TableRow key={conversation.id}>
                    <TableCell className="font-medium">
                      {conversation.phone_number || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {conversation.contact_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(conversation.call_successful)}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(conversation.start_time_unix).split(' ')[0]}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(conversation.start_time_unix).split(' ')[1]}
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
                      {conversation.has_audio ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => playCallRecording(conversation.id)}
                          className="gap-1"
                        >
                          <Play className="h-4 w-4" />
                          Play
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">No audio</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTranscript(conversation);
                          fetchTranscript(conversation.conversation_id);
                        }}
                        className="gap-1"
                      >
                        <MessageSquare className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEvaluation(conversation)}
                        className="gap-1"
                      >
                        <BarChart3 className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDataCollection(conversation)}
                        className="gap-1"
                      >
                        <FileText className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
                          {message.time_in_call_secs}s
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