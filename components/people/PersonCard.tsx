import Link from "next/link";
import { formatLifespan, getInitials } from "@/lib/utils";
import { Person } from "@/types/person";

interface PersonCardProps {
  person: Person;
  variant?: "default" | "compact" | "detailed";
  onClick?: () => void;
}

export function PersonCard({ person, variant = "default", onClick }: PersonCardProps) {
  const lifespan = formatLifespan(person.birth_date, person.death_date, person.is_living);
  const initials = getInitials(person.name);

  if (variant === "compact") {
    return (
      <Link
        href={`/people/${person.id}`}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
        onClick={(e) => { e.preventDefault(); onClick?.(); }}
      >
        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium text-sm">
          {person.profile_image ? (
            <img src={person.profile_image} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground truncate">{person.name}</p>
          <p className="text-xs text-muted-foreground truncate">{lifespan}</p>
        </div>
      </Link>
    );
  }

  if (variant === "detailed") {
    return (
      <article className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-display font-bold text-2xl flex-shrink-0">
            {person.profile_image ? (
              <img src={person.profile_image} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-xl font-semibold text-foreground">{person.name}</h3>
            <p className="text-muted-foreground mt-1">{lifespan}</p>
            {person.birth_place && (
              <p className="text-sm text-muted-foreground mt-1">Born in {person.birth_place}</p>
            )}
            {person.death_place && (
              <p className="text-sm text-muted-foreground">Died in {person.death_place}</p>
            )}
          </div>
        </div>
        {person.bio && (
          <p className="mt-4 text-sm text-muted-foreground line-clamp-3">{person.bio}</p>
        )}
        <div className="mt-4 flex items-center gap-2">
          <Link
            href={`/people/${person.id}`}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View Profile
          </Link>
        </div>
      </article>
    );
  }

  return (
    <Link
      href={`/people/${person.id}`}
      className="group bg-card border border-border rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all"
      onClick={(e) => { e.preventDefault(); onClick?.(); }}
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-display font-bold text-xl flex-shrink-0">
          {person.profile_image ? (
            <img src={person.profile_image} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground group-hover:text-primary-600 transition-colors truncate">
            {person.name}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">{lifespan}</p>
          {person.birth_place && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">Born: {person.birth_place}</p>
          )}
        </div>
      </div>
    </Link>
  );
}