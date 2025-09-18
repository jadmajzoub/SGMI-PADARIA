import { Box, Paper, Stack, Skeleton as MuiSkeleton } from '@mui/material'

export function SkeletonProductionEntry() {
  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        minHeight: "calc(100vh - 120px)",
      }}
    >
      <Paper
        sx={{
          width: "100%",
          maxWidth: 680,
          p: { xs: 3, md: 4 },
          borderRadius: 4,
        }}
      >
        <Stack spacing={3}>
          <MuiSkeleton variant="text" width="60%" height={48} sx={{ mx: 'auto' }} />

          {/* Product Field */}
          <Box>
            <MuiSkeleton variant="text" width="20%" height={20} sx={{ mb: 1 }} />
            <MuiSkeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
            <MuiSkeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {[1, 2, 3].map((i) => (
                <MuiSkeleton key={i} variant="rectangular" width={100} height={32} sx={{ borderRadius: 20 }} />
              ))}
            </Stack>
          </Box>

          {/* Shift Field */}
          <Box>
            <MuiSkeleton variant="text" width="15%" height={20} sx={{ mb: 1 }} />
            <MuiSkeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
          </Box>

          {/* Bateladas Field */}
          <Box>
            <MuiSkeleton variant="text" width="25%" height={20} sx={{ mb: 1 }} />
            <MuiSkeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
            <MuiSkeleton variant="text" width="50%" height={16} sx={{ mt: 0.5 }} />
          </Box>

          {/* Duration Field */}
          <Box>
            <MuiSkeleton variant="text" width="35%" height={20} sx={{ mb: 1 }} />
            <MuiSkeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
            <MuiSkeleton variant="text" width="45%" height={16} sx={{ mt: 0.5 }} />
          </Box>

          {/* Date Field */}
          <Box>
            <MuiSkeleton variant="text" width="15%" height={20} sx={{ mb: 1 }} />
            <MuiSkeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
          </Box>

          {/* Submit Button */}
          <MuiSkeleton variant="rectangular" width="100%" height={52} sx={{ borderRadius: 999 }} />
        </Stack>
      </Paper>
    </Box>
  )
}

export function SkeletonProductionSession() {
  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={3}>
        <MuiSkeleton variant="text" width="50%" height={48} />
        
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <MuiSkeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 2 }} />
          <MuiSkeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 2 }} />
          <MuiSkeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 2 }} />
        </Stack>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <MuiSkeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
          <Stack spacing={2}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <MuiSkeleton variant="text" width="20%" height={20} />
                <MuiSkeleton variant="text" width="30%" height={20} />
                <MuiSkeleton variant="text" width="15%" height={20} />
                <Box sx={{ flexGrow: 1 }} />
                <MuiSkeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
              </Box>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}