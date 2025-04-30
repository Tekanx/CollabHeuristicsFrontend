import { Box, Paper, Typography, Card, CardContent, Avatar } from '@mui/material';

interface Participant {
  id: number;
  nombre: string;
  apellido: string;
  avatar: string;
  currentStep: number;
}

interface ParticipantsListProps {
  participants: Participant[];
  getStepName: (step: number) => string;
}

export default function ParticipantsList({ participants, getStepName }: ParticipantsListProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Participantes
      </Typography>
      <Box sx={{ mt: 2 }}>
        {participants.map((participant) => (
          <Card key={participant.id} sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 50, height: 50 }}>
                {participant.nombre.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {`${participant.nombre} ${participant.apellido}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {`Paso actual: ${getStepName(participant.currentStep)}`}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Paper>
  );
} 