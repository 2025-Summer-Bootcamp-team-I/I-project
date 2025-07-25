import React, { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useReportIdStore } from '../store/reportIdStore';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredAD8?: boolean;
  requiredChat?: boolean;
  requiredDrawing?: boolean;
  alertMessage: string;
  redirectCardIndex: number;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredAD8 = false,
  requiredChat = false,
  requiredDrawing = false,
  alertMessage,
  redirectCardIndex,
}) => {
  const { isAD8Completed, isChatCompleted, isDrawingCompleted } = useReportIdStore();
  const navigate = useNavigate();
  const alertShownRef = useRef(false); // Use a ref to track if alert has been shown for this instance

  useEffect(() => {
    let shouldRedirect = false;
    if (requiredAD8 && !isAD8Completed) {
      shouldRedirect = true;
    } else if (requiredChat && !isChatCompleted) {
      shouldRedirect = true;
    } else if (requiredDrawing && !isDrawingCompleted) {
      shouldRedirect = true;
    }

    if (shouldRedirect && !alertShownRef.current) {
      alert(alertMessage);
      alertShownRef.current = true; // Mark as shown
      navigate('/main', { state: { cardIndex: redirectCardIndex }, replace: true });
    }
  }, [
    requiredAD8, isAD8Completed,
    requiredChat, isChatCompleted,
    requiredDrawing, isDrawingCompleted,
    alertMessage, redirectCardIndex, navigate
  ]);

  // If a redirect is pending, render nothing or a loading spinner
  // to prevent flickering of the protected content.
  // The useEffect above will handle the actual navigation.
  if (
    (requiredAD8 && !isAD8Completed) ||
    (requiredChat && !isChatCompleted) ||
    (requiredDrawing && !isDrawingCompleted)
  ) {
    return null; // Or a loading spinner
  }

  // If conditions are met, render the children
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
