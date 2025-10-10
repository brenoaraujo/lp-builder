import React from 'react';
import { Sheet, SheetPortal, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Download, X } from 'lucide-react';
import { toast } from 'sonner';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

export default function AdminInviteDetails({ invite, open, onClose }) {
  if (!invite) return null;

  const charityInfo = invite.onboarding_json?.charityInfo || {};
  const overrides = invite.overrides_json || {};
  const images = invite.images_json || {};

  // Use user-provided charity name from onboarding if available, otherwise fall back to production name
  const getCharityName = () => {
    return charityInfo.charityName || invite.charity_name;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const downloadImage = (imageUrl, filename) => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'invited': return 'invited';
      case 'in_progress': return 'in_progress';
      case 'submitted': return 'submitted';
      case 'handed_off': return 'handed_off';
      case 'void': return 'void';
      default: return 'default';
    }
  };

  const getVariantLabel = (variant) => {
    const labels = { A: 'Layout A', B: 'Layout B', C: 'Layout C' };
    return labels[variant] || variant;
  };

  const renderColorSwatch = (color) => {
    if (!color) return null;
    return (
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
        onClick={() => copyToClipboard(color, 'Color')}
      >
        <div 
          className="w-4 h-4 rounded border" 
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-mono">{color}</span>
        <Copy className="w-3 h-3 text-muted-foreground" />
      </div>
    );
  };

  const renderSectionAccordion = (sectionKey, sectionData) => {
    // Images are stored with IDs like "hero-image", "feature-image", etc.
    // We need to find all images that belong to this section
    const sectionImages = {};
    Object.entries(images).forEach(([imageId, imageUrl]) => {
      if (imageId.includes(sectionKey.toLowerCase()) || 
          (sectionKey === 'hero' && imageId === 'hero-image') ||
          (sectionKey === 'feature' && imageId === 'feature-image') ||
          (sectionKey === 'winners' && imageId.startsWith('winner')) ||
          (sectionKey === 'whoYouHelp' && imageId === 'who-you-help-image')) {
        sectionImages[imageId] = imageUrl;
      }
    });
    
    return (
      <AccordionItem key={sectionKey} value={sectionKey}>
        <AccordionTrigger className="text-left">
          <div className="flex items-center gap-2">
            <span className="capitalize">{sectionKey.replace(/([A-Z])/g, ' $1').trim()}</span>
            {sectionData.visible === false && (
              <Badge variant="outline" className="text-xs">Hidden</Badge>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <Table>
            <TableBody>
              {/* Layout */}
              <TableRow>
                <TableHead className="w-1/3">Layout</TableHead>
                <TableCell>{getVariantLabel(sectionData.variant)}</TableCell>
              </TableRow>

              {/* Copy Fields */}
              {sectionData.copy && Object.entries(sectionData.copy)
                .filter(([key]) => !key.includes('action'))
                .map(([key, value]) => (
                  <TableRow 
                    key={key}
                    className={value ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={value ? () => copyToClipboard(value, key.replace(/([A-Z])/g, ' $1').trim()) : undefined}
                  >
                    <TableHead className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </TableHead>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{value || 'Not set'}</span>
                        {value && <Copy className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

              {/* Button Links */}
              {sectionData.copy && Object.entries(sectionData.copy)
                .filter(([key]) => key.includes('action'))
                .map(([key, value]) => (
                  <TableRow key={key}>
                    <TableHead className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace('action', '').trim()} Link
                    </TableHead>
                    <TableCell className="break-all">{value || 'Not set'}</TableCell>
                  </TableRow>
                ))}

              {/* Display Settings */}
              {sectionData.display && Object.entries(sectionData.display).map(([key, value]) => (
                <TableRow key={key}>
                  <TableHead className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </TableHead>
                  <TableCell>
                    <Badge variant={value ? "submitted" : "void"} className="text-xs">
                      {value ? 'Visible' : 'Hidden'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}

              {/* Theme Colors */}
              {sectionData.theme?.enabled && sectionData.theme?.values && 
                Object.entries(sectionData.theme.values).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableHead className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()} Color
                    </TableHead>
                    <TableCell>
                      {renderColorSwatch(value)}
                    </TableCell>
                  </TableRow>
                ))}

              {/* Images */}
              {Object.entries(sectionImages).map(([imageKey, imageUrl]) => (
                <TableRow key={imageKey}>
                  <TableHead className="capitalize">
                    {imageKey.replace(/([A-Z])/g, ' $1').trim()} Image
                  </TableHead>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <img 
                        src={imageUrl} 
                        alt={imageKey} 
                        className="w-12 h-12 object-cover border rounded"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadImage(imageUrl, `${sectionKey}-${imageKey}`)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetPortal>
        {/* Custom SheetContent without backdrop */}
        <SheetPrimitive.Content
          className={cn(
            "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "inset-y-0 right-0 h-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
          )}
          style={{ maxWidth: '620px', minWidth: '390px' }}
        >
          <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        <SheetHeader>
          <SheetTitle className="text-xl">{getCharityName()}</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-6">
            <Accordion type="multiple" defaultValue={["details"]} className="space-y-2">
            {/* Details Section */}
            <AccordionItem value="details">
              <AccordionTrigger>Details</AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableHead className="w-1/3">Charity Name</TableHead>
                      <TableCell>{getCharityName()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableCell>
                        <Badge variant={getStatusVariant(invite.status)}>
                          {invite.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => copyToClipboard(charityInfo.submitterName || invite.contact_name, 'Contact Name')}
                    >
                      <TableHead>Contact Name</TableHead>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{charityInfo.submitterName || invite.contact_name}</span>
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => copyToClipboard(invite.contact_email, 'Contact Email')}
                    >
                      <TableHead>Contact Email</TableHead>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{invite.contact_email}</span>
                          <Copy className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>Raffle Type</TableHead>
                      <TableCell>{charityInfo.raffleType || 'Not specified'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>Ascend Representative</TableHead>
                      <TableCell>{charityInfo.ascendRepresentative || 'Not specified'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>Charity Website</TableHead>
                      <TableCell className="break-all">{charityInfo.charitySite || 'Not provided'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>Campaign Launch Date</TableHead>
                      <TableCell>{charityInfo.campaignLaunchDate || 'Not specified'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>Invite Token</TableHead>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                            {invite.public_token}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(invite.public_token, 'Token')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {charityInfo.charityLogo && (
                      <TableRow>
                        <TableHead>Charity Logo</TableHead>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <img 
                              src={charityInfo.charityLogo} 
                              alt="Charity Logo" 
                              className="w-16 h-16 object-contain border rounded"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadImage(charityInfo.charityLogo, 'charity-logo')}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableHead>Created</TableHead>
                      <TableCell>{formatDate(invite.created_at)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead>Last Updated</TableHead>
                      <TableCell>{formatDate(invite.updated_at)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>

            {/* Section Accordions */}
            {Object.entries(overrides).map(([sectionKey, sectionData]) => 
              renderSectionAccordion(sectionKey, sectionData)
            )}

            {/* Global Theme */}
            {invite.theme_json && (
              <AccordionItem value="theme">
                <AccordionTrigger>Global Theme</AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableBody>
                      {/* Colors */}
                      {invite.theme_json.colors && Object.entries(invite.theme_json.colors).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableHead className="capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()} Color
                          </TableHead>
                          <TableCell>
                            {renderColorSwatch(value)}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Fonts */}
                      {invite.theme_json.fonts && Object.entries(invite.theme_json.fonts).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableHead className="capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()} Font
                          </TableHead>
                          <TableCell>{value || 'Default'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
        </ScrollArea>
        </SheetPrimitive.Content>
      </SheetPortal>
    </Sheet>
  );
}
